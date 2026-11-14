using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Services;
using ArkaSoftwarePro.Src.Core.Contracts.SupportTickets;
using ArkaSoftwarePro.Src.Core.Contracts.SupportTickets.SupportTicketRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.DashboardAggregate;
using ArkaSoftwarePro.Src.Core.Domain.DashboardAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.DashboardAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.UserNotificationAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Commands.CreatePlatformSupportTicket;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportTicketServices.Commands;

public class CreatePlatformSupportTicketCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ISupportTicketCommandRepository ticketRepository,
    IUserQueryRepository userQueryRepository,
    IUserNotificationCommandRepository notificationRepository,
    IPlatformSupportTicketRealtimeNotifier realtimeNotifier,
    IEmailService emailService,
    UserEmailVerificationGuard emailVerificationGuard)
    : CommandHandler<CreatePlatformSupportTicketCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(CreatePlatformSupportTicketCommand command)
    {
        if (command.UserId <= 0)
            return await ResultAsync(string.Empty, ApplicationServiceStatus.NotFound);

        var emailCheck = await emailVerificationGuard.EnsureVerifiedAsync(command.UserId, CancellationToken.None);
        if (!emailCheck.Ok)
        {
            AddMessage(emailCheck.Message);
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        var subject = (command.Subject ?? string.Empty).Trim();
        var content = command.ContentHtml ?? string.Empty;
        var department = (command.Department ?? string.Empty).Trim();

        if (subject.Length < 3)
        {
            AddMessage("Subject is required.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        if (!SupportTicketDepartment.IsValid(department))
        {
            AddMessage("Invalid department.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        if (!HasContent(content))
        {
            AddMessage("Message content is required.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        var user = await userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = command.UserId });
        if (user == null)
            return await ResultAsync(string.Empty, ApplicationServiceStatus.NotFound);

        var requesterName = BuildDisplayName(user.FirstName, user.LastName, user.UserName, user.Email);
        var displayNumber = await ticketRepository.GetNextDisplayNumberAsync();
        var ticket = SupportTicket.CreatePlatform(
            displayNumber,
            command.UserId,
            subject,
            content,
            department,
            requesterName,
            user.Email ?? string.Empty,
            user.Avatar);

        await ticketRepository.InsertAsync(ticket);
        await ticketRepository.CommitAsync();

        var preview = SupportTicketFormatting.StripHtml(content, 100);
        var adminIds = await ticketRepository.GetAdminUserIdsAsync();
        var displayCode = SupportTicketFormatting.FormatDisplayCode(displayNumber);
        var adminNotifications = adminIds.Select(adminId => UserNotification.Create(
            adminId,
            "تیکت پشتیبانی جدید",
            $"{requesterName} تیکت {displayCode} ثبت کرد: {preview}",
            "admin_new_platform_ticket",
            $"/dashboard/support-tickets/{ticket.Id}",
            ticket.Id)).ToList();

        if (adminNotifications.Count > 0)
            await notificationRepository.InsertManyAsync(adminNotifications);
        await notificationRepository.CommitAsync();

        await realtimeNotifier.NotifyTicketOpenedAsync(new PlatformSupportTicketOpenedEvent(
            ticket.Id,
            displayNumber,
            displayCode,
            subject,
            department,
            ticket.Status,
            command.UserId,
            requesterName,
            preview));

        foreach (var adminId in adminIds)
        {
            try { await realtimeNotifier.NotifyAdminPulseAsync(); } catch { /* best effort */ }
            try { await realtimeNotifier.NotifyUserPulseAsync(adminId); } catch { /* best effort */ }
        }

        var adminRecipients = await ticketRepository.GetAdminEmailRecipientsAsync();
        var adminTicketLink = $"/dashboard/support-tickets/{ticket.Id}";
        foreach (var admin in adminRecipients)
        {
            try
            {
                await emailService.SendPlatformTicketCreatedToAdminAsync(
                    admin.Email,
                    admin.DisplayName,
                    requesterName,
                    displayCode,
                    subject,
                    preview,
                    adminTicketLink,
                    CancellationToken.None);
            }
            catch
            {
                // Email failure must not block ticket creation.
            }
        }

        return await OkAsync(ticket.Id.ToString());
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
