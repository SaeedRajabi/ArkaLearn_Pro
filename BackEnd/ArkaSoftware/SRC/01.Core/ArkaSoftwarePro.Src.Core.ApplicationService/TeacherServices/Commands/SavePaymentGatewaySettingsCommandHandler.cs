using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Finance;
using ArkaSoftwarePro.Src.Core.Contracts.Finance.FinanceRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Security;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.SavePaymentGatewaySettings;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Commands;

public class SavePaymentGatewaySettingsCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherFinanceCommandRepository financeCommandRepository,
    ISecretProtector secretProtector,
    IPaymentGatewaySettingsCache paymentGatewaySettingsCache,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<SavePaymentGatewaySettingsCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(SavePaymentGatewaySettingsCommand command)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
            return await ResultAsync("Admin access required.", ApplicationServiceStatus.ValidationError);

        var provider = (command.Provider ?? string.Empty).Trim();
        if (provider is not ("ZarinPal" or "Zibal"))
            return await ResultAsync("Invalid payment gateway provider.", ApplicationServiceStatus.ValidationError);

        var settings = await financeCommandRepository.GetOrCreateSettingsAsync();
        settings.UpdatePaymentGatewaySettings(provider, command.Enabled);

        if (command.Zibal is not null)
        {
            settings.UpdateZibalCredentials(
                EncryptIfProvided(command.Zibal.MerchantId),
                EncryptIfProvided(command.Zibal.ApiKey),
                EncryptIfProvided(command.Zibal.AccessToken),
                command.Zibal.UseSandbox ?? settings.ZibalUseSandbox);
        }

        if (command.ZarinPal is not null)
        {
            settings.UpdateZarinPalCredentials(
                EncryptIfProvided(command.ZarinPal.MerchantId),
                EncryptIfProvided(command.ZarinPal.AccessToken),
                EncryptIfProvided(command.ZarinPal.TerminalId),
                command.ZarinPal.UseSandbox ?? settings.ZarinPalUseSandbox);
        }

        await financeCommandRepository.SaveSettingsAsync(settings);
        await financeCommandRepository.CommitAsync();
        await paymentGatewaySettingsCache.RefreshAsync();
        return await OkAsync("Payment gateway settings saved.");
    }

    private string? EncryptIfProvided(string? value)
    {
        if (value is null)
            return null;

        return string.IsNullOrWhiteSpace(value) ? string.Empty : secretProtector.Protect(value.Trim());
    }
}
