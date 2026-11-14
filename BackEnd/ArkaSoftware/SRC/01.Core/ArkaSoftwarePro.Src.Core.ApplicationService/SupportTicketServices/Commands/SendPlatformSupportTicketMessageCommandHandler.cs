using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Services;
using ArkaSoftwarePro.Src.Core.Contracts.SupportTickets;
using ArkaSoftwarePro.Src.Core.Contracts.SupportTickets.SupportTicketRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.DashboardAggregate;
using ArkaSoftwarePro.Src.Core.Domain.DashboardAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.UserNotificationAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Commands.SendPlatformSupportTicketMessage;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportTicketServices.Commands;

public class SendPlatformSupportTicketMessageCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ISupportTicketCommandRepository ticketRepository,
    IUserQueryRepository userQueryRepository,
    IUserNotificationCommandRepository notificationRepository,
    IEmailService emailService,
    IPlatformSupportTicketRealtimeNotifier realtimeNotifier,
    UserEmailVerificationGuard emailVerificationGuard)
    : CommandHandler<SendPlatformSupportTicketMessageCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(SendPlatformSupportTicketMessageCommand command)
    {
        if (command.UserId <= 0 || command.TicketId <= 0)
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);

        var content = command.ContentHtml ?? string.Empty;
        if (!HasContent(content))
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);

        var ticket = await ticketRepository.GetWithMessagesAsync(command.TicketId);
        if (ticket == null || ticket.IsDelete || !ticket.IsPlatformTicket())
            return await ResultAsync(string.Empty, ApplicationServiceStatus.NotFound);

        if (!command.IsStaffMessage && !ticket.IsOwnedBy(command.UserId))
            return await ResultAsync(string.Empty, ApplicationServiceStatus.NotFound);

        if (!command.IsStaffMessage)
        {
            var emailCheck = await emailVerificationGuard.EnsureVerifiedAsync(command.UserId, CancellationToken.None);
            if (!emailCheck.Ok)
            {
                AddMessage(emailCheck.Message);
                return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
            }
        }

        long? replyToMessageId = null;
        string? replyToSenderName = null;
        string? replyToContentPreview = null;

        if (command.ReplyToMessageId is > 0)
        {
            var replyTarget = ticket.Messages.FirstOrDefault(m => m.Id == command.ReplyToMessageId.Value);
            if (replyTarget == null || replyTarget.IsDelete)
                return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);

            replyToMessageId = replyTarget.Id;
            if (replyTarget.IsStaffMessage)
            {
                replyToSenderName = "پشتیبانی سایت";
            }
            else
            {
                var replySender = await userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = replyTarget.SenderUserId });
                replyToSenderName = BuildDisplayName(replySender?.FirstName, replySender?.LastName, replySender?.UserName, replySender?.Email);
            }
            replyToContentPreview = SupportTicketFormatting.StripHtml(replyTarget.ContentHtml, 80);
        }

        var previousStatus = ticket.Status;

        var message = command.IsStaffMessage
            ? ticket.AddStaffMessage(command.UserId, content, replyToMessageId)
            : ticket.AddUserMessage(command.UserId, content, replyToMessageId);
        ticket.UpdateLastMessagePreview(message);
        await ticketRepository.CommitAsync();

        var sender = await userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = command.UserId });
        var senderName = command.IsStaffMessage
            ? "پشتیبانی سایت"
            : BuildDisplayName(sender?.FirstName, sender?.LastName, sender?.UserName, sender?.Email);
        var preview = SupportTicketFormatting.StripHtml(content, 100);
        var displayCode = SupportTicketFormatting.FormatDisplayCode(ticket.DisplayNumber);

        if (command.IsStaffMessage)
        {
            try
            {
                await emailService.SendPlatformTicketRepliedAsync(
                    ticket.RequesterEmail,
                    ticket.RequesterName,
                    displayCode,
                    ticket.Subject,
                    SupportTicketFormatting.StripHtml(content, 2000),
                    $"/support?ticket={ticket.Id}",
                    CancellationToken.None);
            }
            catch
            {
                // Email failure must not block message delivery.
            }

            if (ticket.RequesterUserId is > 0)
            {
                await notificationRepository.InsertAsync(UserNotification.Create(
                    ticket.RequesterUserId.Value,
                    "پاسخ تیکت پشتیبانی",
                    $"پشتیبانی به تیکت {displayCode} پاسخ داد: {preview}",
                    "platform_ticket_replied",
                    $"/support?ticket={ticket.Id}",
                    message.Id));
                await notificationRepository.CommitAsync();
            }
        }
        else
        {
            var adminIds = await ticketRepository.GetAdminUserIdsAsync();
            var adminNotifications = adminIds.Select(adminId => UserNotification.Create(
                adminId,
                "پیام جدید در تیکت",
                $"{senderName} در {displayCode} پیام جدید ارسال کرد: {preview}",
                "admin_platform_ticket_message",
                $"/dashboard/support-tickets/{ticket.Id}",
                message.Id)).ToList();
            if (adminNotifications.Count > 0)
                await notificationRepository.InsertManyAsync(adminNotifications);
            await notificationRepository.CommitAsync();
        }

        await realtimeNotifier.NotifyMessagePostedAsync(new PlatformSupportTicketMessagePostedEvent(
            ticket.Id,
            message.Id,
            command.UserId,
            senderName,
            content,
            message.SentAtUtc,
            command.IsStaffMessage,
            ticket.RequesterUserId ?? 0,
            ticket.Status,
            ticket.Subject,
            replyToMessageId,
            replyToSenderName,
            replyToContentPreview));

        if (command.IsStaffMessage && previousStatus != ticket.Status && ticket.RequesterUserId is > 0)
        {
            await realtimeNotifier.NotifyTicketStatusChangedAsync(new PlatformSupportTicketStatusChangedEvent(
                ticket.Id,
                ticket.Status,
                ticket.RequesterUserId.Value));
        }

        if (command.IsStaffMessage && ticket.RequesterUserId is > 0)
            await realtimeNotifier.NotifyUserPulseAsync(ticket.RequesterUserId.Value);
        else
            await realtimeNotifier.NotifyAdminPulseAsync();

        return await OkAsync(message.Id.ToString());
    }

    private static bool HasContent(string html) =>
        html.Replace("<p></p>", "", StringComparison.OrdinalIgnoreCase).Trim().Length >= 1;

    private static string BuildDisplayName(string? first, string? last, string? userName, string? email)
    {
        var full = $"{first} {last}".Trim();
        if (!string.IsNullOrWhiteSpace(full)) return full;
        if (!string.IsNullOrWhiteSpace(userName)) return userName;
        return email ?? "کاربر";
    }
}
