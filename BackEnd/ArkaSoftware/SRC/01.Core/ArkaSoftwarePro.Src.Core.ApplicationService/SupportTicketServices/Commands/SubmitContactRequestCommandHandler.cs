using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.Contracts.ProjectQuestions;
using ArkaSoftwarePro.Src.Core.Contracts.SupportTickets.SupportTicketRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.DashboardAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UserNotificationAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Commands.SubmitContactRequest;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportTicketServices.Commands;

public class SubmitContactRequestCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ISupportTicketCommandRepository ticketRepository,
    IUserNotificationCommandRepository notificationRepository,
    IEmailVerificationService emailVerificationService,
    IProjectQaRealtimeNotifier realtimeNotifier)
    : CommandHandler<SubmitContactRequestCommand, string>(outer)
{
    private const int MaxFullNameLength = 200;
    private const int MaxNotificationPreviewLength = 80;

    public override async Task<CommandResult<string>> Handle(SubmitContactRequestCommand command)
    {
        try
        {
            var fullName = Truncate((command.FullName ?? string.Empty).Trim(), MaxFullNameLength);
            var email = (command.Email ?? string.Empty).Trim().ToLowerInvariant();
            var message = (command.Message ?? string.Empty).Trim();
            var sessionId = (command.EmailOtpSessionId ?? string.Empty).Trim();
            var otpCode = (command.EmailOtpCode ?? string.Empty).Trim();

            if (fullName.Length < 2)
            {
                AddMessage("Full name is required.");
                return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
            }

            if (!email.Contains('@') || !email.Contains('.'))
            {
                AddMessage("Invalid email address.");
                return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
            }

            if (message.Length < 10)
            {
                AddMessage("Message must be at least 10 characters.");
                return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
            }

            if (string.IsNullOrWhiteSpace(sessionId) || string.IsNullOrWhiteSpace(otpCode))
            {
                AddMessage("Email verification code is required.");
                return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
            }

            var verified = await emailVerificationService.VerifyContactEmailOtpAsync(sessionId, email, otpCode, CancellationToken.None);
            if (!verified)
            {
                AddMessage("Invalid or expired verification code.");
                return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
            }

            var displayNumber = await ticketRepository.GetNextDisplayNumberAsync();
            var ticket = SupportTicket.CreateContactRequest(displayNumber, fullName, email, message);
            await ticketRepository.InsertAsync(ticket);
            await ticketRepository.CommitAsync();

            await TryNotifyAdminsAsync(fullName, email, message, ticket);

            return await OkAsync(ticket.Id.ToString());
        }
        catch (Exception)
        {
            AddMessage("Unable to submit your request right now. Please try again later.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }
    }

    private async Task TryNotifyAdminsAsync(string fullName, string email, string message, SupportTicket ticket)
    {
        try
        {
            var preview = message.Length > MaxNotificationPreviewLength
                ? message[..MaxNotificationPreviewLength] + "..."
                : message;
            var adminIds = await ticketRepository.GetAdminUserIdsAsync();
            var adminNotifications = adminIds.Select(adminId => UserNotification.Create(
                adminId,
                "New contact request",
                $"{fullName} ({email}) requested a connection: {preview}",
                "admin_new_contact_request",
                $"/dashboard/support-tickets/{ticket.Id}",
                ticket.Id)).ToList();

            if (adminNotifications.Count > 0)
                await notificationRepository.InsertManyAsync(adminNotifications);

            await notificationRepository.CommitAsync();

            foreach (var adminId in adminIds)
            {
                try
                {
                    await realtimeNotifier.NotifyUserNotificationAsync(adminId);
                }
                catch
                {
                    // Realtime pulse is best-effort.
                }
            }
        }
        catch
        {
            // Ticket is already saved; admin notifications must not block the visitor.
        }
    }

    private static string Truncate(string value, int maxLength)
        => value.Length <= maxLength ? value : value[..maxLength];
}
