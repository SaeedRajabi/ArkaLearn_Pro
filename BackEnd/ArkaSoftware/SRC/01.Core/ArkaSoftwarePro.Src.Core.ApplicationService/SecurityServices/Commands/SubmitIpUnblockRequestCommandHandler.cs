using ArkaSoftwarePro.Src.Core.Contracts.IPBlacklist.IPBlacklistRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Sms;
using ArkaSoftwarePro.Src.Core.Contracts.SupportTickets.SupportTicketRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityTokenContracts;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.DashboardAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UserNotificationAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.Security.Commands.SubmitIpUnblockRequest;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices.Commands;

public class SubmitIpUnblockRequestCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IPhoneVerificationService phoneVerificationService,
    IUserQueryRepository userQueryRepository,
    IIPBlacklistQueryRepository ipBlacklistQueryRepository,
    ISupportTicketCommandRepository ticketRepository,
    IUserNotificationCommandRepository notificationRepository,
    IUserDeviceInfoService userInfoService)
    : CommandHandler<SubmitIpUnblockRequestCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(SubmitIpUnblockRequestCommand command)
    {
        var ip = userInfoService.GetUserInfo().IpAddress;
        if (string.IsNullOrWhiteSpace(ip) || !await ipBlacklistQueryRepository.IsIpBlockedAsync(ip))
        {
            AddMessage("This IP address is not blocked.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        if (!IranianPhoneNormalizer.TryNormalizeLocalNumber(command.PhoneNumber, out var localPhone))
        {
            AddMessage("A valid phone number is required.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        var user = await userQueryRepository.GetUserByLocalPhoneAsync(localPhone);
        if (user is null)
        {
            AddMessage("No account found for this phone number.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        var message = (command.Message ?? string.Empty).Trim();
        if (message.Length < 10)
        {
            AddMessage("Message must be at least 10 characters.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        var sessionId = (command.OtpSessionId ?? string.Empty).Trim();
        var otpCode = (command.OtpCode ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(sessionId) || string.IsNullOrWhiteSpace(otpCode))
        {
            AddMessage("Phone verification code is required.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        var verified = await phoneVerificationService.IsIpUnblockVerifiedAsync(sessionId, command.PhoneNumber, CancellationToken.None);
        if (!verified)
        {
            var ok = await phoneVerificationService.VerifyIpUnblockOtpAsync(sessionId, command.PhoneNumber, otpCode, CancellationToken.None);
            if (!ok)
            {
                AddMessage("Invalid or expired verification code.");
                return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
            }
        }

        var displayNumber = await ticketRepository.GetNextDisplayNumberAsync();
        var ticket = SupportTicket.CreateIpUnblockRequest(
            displayNumber,
            user.UserId,
            user.FullName,
            user.Email,
            ip,
            message);
        await ticketRepository.InsertAsync(ticket);
        await ticketRepository.CommitAsync();

        await TryNotifyAdminsAsync(user.FullName, ip, ticket.Id);

        return await OkAsync(ticket.Id.ToString());
    }

    private async Task TryNotifyAdminsAsync(string requesterName, string ip, long ticketId)
    {
        try
        {
            var preview = $"IP unblock request from {requesterName} ({ip})";
            var adminIds = await ticketRepository.GetAdminUserIdsAsync();
            var adminNotifications = adminIds.Select(adminId => UserNotification.Create(
                adminId,
                "IP unblock request",
                preview,
                "admin_ip_unblock_request",
                $"/dashboard/support-tickets/{ticketId}",
                ticketId)).ToList();

            if (adminNotifications.Count > 0)
                await notificationRepository.InsertManyAsync(adminNotifications);

            await notificationRepository.CommitAsync();
        }
        catch
        {
            // Non-fatal
        }
    }
}
