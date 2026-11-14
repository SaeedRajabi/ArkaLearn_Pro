using ArkaSoftwarePro.Src.Core.Contracts.Finance.FinanceRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.SavePlatformPayoutBankSettings;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Commands;

public class SavePlatformPayoutBankSettingsCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherFinanceCommandRepository financeCommandRepository)
    : CommandHandler<SavePlatformPayoutBankSettingsCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(SavePlatformPayoutBankSettingsCommand command)
    {
        var settings = await financeCommandRepository.GetOrCreateSettingsAsync();
        var sheba = NormalizeSheba(command.PlatformPayoutSheba);
        var card = NormalizeCard(command.PlatformPayoutCardNumber);

        if (string.IsNullOrWhiteSpace(sheba) || string.IsNullOrWhiteSpace(card))
            return await ResultAsync("Platform Sheba and card number are required.", ApplicationServiceStatus.ValidationError);

        settings.UpdatePlatformPayoutBankSettings(sheba, card, command.ZarinPalPlatformBankAccountId);
        await financeCommandRepository.SaveSettingsAsync(settings);
        await financeCommandRepository.CommitAsync();
        return await OkAsync("Platform payout bank settings saved.");
    }

    private static string? NormalizeSheba(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var compact = value.Trim().ToUpperInvariant().Replace(" ", string.Empty);
        if (compact.StartsWith("IR", StringComparison.Ordinal))
            compact = compact[2..];
        var digits = new string(compact.Where(char.IsDigit).ToArray());
        return digits.Length == 24 ? "IR" + digits : null;
    }

    private static string? NormalizeCard(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var digits = new string(value.Where(char.IsDigit).ToArray());
        return digits.Length == 16 ? digits : null;
    }
}
