using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.NotificationSettings;
using ArkaSoftwarePro.Src.Core.Contracts.Services;
using ArkaSoftwarePro.Src.Core.Contracts.Sms;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.AdminBulkNotify;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Commands;

public class AdminBulkNotifyCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IUserQueryRepository userQueryRepository,
    IEmailService emailService,
    INotificationSettingsProvider notificationSettingsProvider,
    ISmsIrClient smsIrClient,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<AdminBulkNotifyCommand, AdminBulkNotifyResult>(outer)
{
    public override async Task<CommandResult<AdminBulkNotifyResult>> Handle(AdminBulkNotifyCommand command)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
        {
            AddMessage("Admin access required.");
            return await ResultAsync(new AdminBulkNotifyResult(), ApplicationServiceStatus.ValidationError);
        }

        var channel = (command.Channel ?? string.Empty).Trim().ToLowerInvariant();
        if (channel is not ("email" or "sms"))
        {
            AddMessage("Channel must be 'email' or 'sms'.");
            return await ResultAsync(new AdminBulkNotifyResult(), ApplicationServiceStatus.ValidationError);
        }

        var subject = (command.Subject ?? string.Empty).Trim();
        var body = (command.Body ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(body))
        {
            AddMessage("Body is required.");
            return await ResultAsync(new AdminBulkNotifyResult(), ApplicationServiceStatus.ValidationError);
        }

        if (channel == "email" && string.IsNullOrWhiteSpace(subject))
        {
            AddMessage("Subject is required for email.");
            return await ResultAsync(new AdminBulkNotifyResult(), ApplicationServiceStatus.ValidationError);
        }

        var userIds = command.UserIds?.Where(x => x > 0).Distinct().ToList() ?? [];
        if (userIds.Count == 0)
        {
            AddMessage("At least one user id is required.");
            return await ResultAsync(new AdminBulkNotifyResult(), ApplicationServiceStatus.ValidationError);
        }

        var sent = 0;
        var failed = 0;

        if (channel == "email")
        {
            foreach (var userId in userIds)
            {
                try
                {
                    var user = await userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = userId });
                    if (user == null || string.IsNullOrWhiteSpace(user.Email))
                    {
                        failed++;
                        continue;
                    }

                    var recipientName = BuildDisplayName(user);
                    await emailService.SendContactReplyAsync(
                        user.Email,
                        recipientName,
                        subject,
                        body,
                        CancellationToken.None);
                    sent++;
                }
                catch
                {
                    failed++;
                }
            }
        }
        else
        {
            var settings = await notificationSettingsProvider.GetCurrentAsync();
            if (settings is not { CanSendSms: true })
            {
                AddMessage("SMS is not configured.");
                return await ResultAsync(new AdminBulkNotifyResult(), ApplicationServiceStatus.ValidationError);
            }

            var phones = new List<string>();
            foreach (var userId in userIds)
            {
                try
                {
                    var user = await userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = userId });
                    if (user == null || string.IsNullOrWhiteSpace(user.PhoneNumber))
                    {
                        failed++;
                        continue;
                    }

                    if (!IranianPhoneNormalizer.TryNormalizeLocalNumber(user.PhoneNumber, out var localPhone))
                    {
                        failed++;
                        continue;
                    }

                    phones.Add($"0{localPhone}");
                }
                catch
                {
                    failed++;
                }
            }

            if (phones.Count > 0)
            {
                try
                {
                    var message = string.IsNullOrWhiteSpace(subject) ? body : $"{subject}\n{body}";
                    await smsIrClient.SendBulkAsync(settings.LineNumber, message, phones, cancellationToken: CancellationToken.None);
                    sent += phones.Count;
                }
                catch
                {
                    failed += phones.Count;
                }
            }
        }

        return await OkAsync(new AdminBulkNotifyResult { Sent = sent, Failed = failed });
    }

    private static string BuildDisplayName(UserQr user)
    {
        if (!string.IsNullOrWhiteSpace(user.FullName))
            return user.FullName.Trim();
        var combined = $"{user.FirstName} {user.LastName}".Trim();
        if (!string.IsNullOrWhiteSpace(combined))
            return combined;
        return user.UserName ?? user.Email ?? "User";
    }
}
