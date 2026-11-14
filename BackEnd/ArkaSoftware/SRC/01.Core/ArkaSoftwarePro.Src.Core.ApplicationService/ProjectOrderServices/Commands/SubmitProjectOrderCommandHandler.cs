using ArkaSoftwarePro.Src.Core.Contracts.NotificationSettings;
using ArkaSoftwarePro.Src.Core.Contracts.ProjectOrders.ProjectOrderRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Sms;
using ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.ProjectOrderAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UserNotificationAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectOrders.Commands.SubmitProjectOrder;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ProjectOrderServices.Commands;

public class SubmitProjectOrderCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IProjectOrderCommandRepository orderRepository,
    IUserNotificationCommandRepository notificationRepository,
    INotificationSettingsProvider settingsProvider,
    IPhoneVerificationService phoneVerificationService)
    : CommandHandler<SubmitProjectOrderCommand, string>(outer)
{
    private static readonly HashSet<string> AllowedProjectTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "organizational",
        "business",
        "academic",
        "startup",
        "personal",
        "other",
    };

    public override async Task<CommandResult<string>> Handle(SubmitProjectOrderCommand command)
    {
        var firstName = (command.FirstName ?? string.Empty).Trim();
        var lastName = (command.LastName ?? string.Empty).Trim();
        var phone = (command.Phone ?? string.Empty).Trim();
        var title = (command.Title ?? string.Empty).Trim();
        var projectType = (command.ProjectType ?? string.Empty).Trim().ToLowerInvariant();

        if (firstName.Length < 2)
        {
            AddMessage("First name is required.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        if (lastName.Length < 2)
        {
            AddMessage("Last name is required.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        if (!IranianPhoneNormalizer.TryNormalizeLocalNumber(phone, out var localPhone))
        {
            AddMessage("A valid phone number is required.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        var settings = await settingsProvider.GetCurrentAsync();
        var otpRequired = settings is { CanSendSms: true, RegistrationOtpEnabled: true };
        if (otpRequired)
        {
            if (string.IsNullOrWhiteSpace(command.OtpSessionId) || string.IsNullOrWhiteSpace(command.OtpCode))
            {
                AddMessage("Phone verification code is required.");
                return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
            }

            var verified = await phoneVerificationService.IsProjectOrderVerifiedAsync(
                command.OtpSessionId.Trim(),
                phone,
                CancellationToken.None);
            if (!verified)
            {
                var otpOk = await phoneVerificationService.VerifyProjectOrderOtpAsync(
                    command.OtpSessionId.Trim(),
                    phone,
                    command.OtpCode.Trim(),
                    CancellationToken.None);
                if (!otpOk)
                {
                    AddMessage("Invalid or expired verification code.");
                    return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
                }
            }
        }

        if (title.Length < 3)
        {
            AddMessage("Project subject must be at least 3 characters.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        if (!AllowedProjectTypes.Contains(projectType))
        {
            AddMessage("Project type is required.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        var requestNumber = await orderRepository.GetNextRequestNumberAsync();
        var storedPhone = $"0{localPhone}";
        var order = ProjectOrder.SubmitGuest(requestNumber, firstName, lastName, storedPhone, title, projectType);

        await orderRepository.InsertAsync(order);
        await orderRepository.CommitAsync();

        var requesterName = $"{firstName} {lastName}".Trim();
        var adminIds = await orderRepository.GetAdminUserIdsAsync();
        var adminNotifications = adminIds.Select(adminId => UserNotification.Create(
            adminId,
            "New project order",
            $"{requesterName} ({storedPhone}) submitted project request #{requestNumber}: \"{title}\".",
            "admin_new_project_order",
            $"/dashboard/project-orders/{order.Id}",
            order.Id)).ToList();

        if (adminNotifications.Count > 0)
            await notificationRepository.InsertManyAsync(adminNotifications);

        await notificationRepository.CommitAsync();

        return await OkAsync(order.Id.ToString());
    }
}
