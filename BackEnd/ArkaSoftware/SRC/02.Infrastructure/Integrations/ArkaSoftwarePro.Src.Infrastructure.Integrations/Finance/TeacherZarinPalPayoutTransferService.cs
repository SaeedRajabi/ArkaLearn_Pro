using ArkaSoftwarePro.Src.Core.Contracts.Finance;
using ArkaSoftwarePro.Src.Core.ApplicationService.PaymentsServices;
using ArkaSoftwarePro.Src.Core.Contracts.Finance.Payments;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Payments;
using Framework.Src.Infrastructure.Payments.ZarinPal.Abstractions;
using Microsoft.Extensions.Options;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.Finance;

public sealed class TeacherZarinPalPayoutTransferService(
    IZarinPalClient zarinPalClient,
    IPaymentGatewaySettingsProvider gatewaySettingsProvider,
    IOptions<PaymentGatewayOptions> paymentOptions) : ITeacherPayoutTransferService
{
    public async Task<TeacherPayoutTransferResult> TransferToTeacherAsync(
        string teacherSheba,
        string? existingZarinPalBankAccountId,
        long amountToman,
        CancellationToken cancellationToken = default)
    {
        var options = await gatewaySettingsProvider.GetAsync(cancellationToken);
        if (!options.Enabled || !PaymentGatewayProviderNormalizer.IsZarinPal(options.Provider))
            return TeacherPayoutTransferResult.Fail("ZarinPal payment gateway is not enabled.");

        if (string.IsNullOrWhiteSpace(options.TerminalId))
            return TeacherPayoutTransferResult.Fail("ZarinPal terminal id is not configured.");

        if (amountToman <= 0)
            return TeacherPayoutTransferResult.Fail("Invalid payout amount.");

        try
        {
            var bankAccountId = existingZarinPalBankAccountId;
            if (string.IsNullOrWhiteSpace(bankAccountId))
            {
                var bankAccount = await zarinPalClient.AddBankAccountAsync(new ZarinPalBankAccountAddRequest
                {
                    Iban = teacherSheba,
                    IsLegal = false,
                }, cancellationToken);
                bankAccountId = bankAccount.Id;
            }

            var gatewayAmount = checked((long)decimal.Round(
                amountToman * options.AmountMultiplier,
                0,
                MidpointRounding.AwayFromZero));

            var payout = await zarinPalClient.AddInstantPayoutAsync(new ZarinPalInstantPayoutAddRequest
            {
                TerminalId = options.TerminalId.Trim(),
                BankAccountId = bankAccountId!,
                Amount = gatewayAmount,
            }, cancellationToken);

            var reference = !string.IsNullOrWhiteSpace(payout.ReferenceId)
                ? payout.ReferenceId
                : payout.Id;

            return TeacherPayoutTransferResult.Ok(reference ?? payout.Id, bankAccountId);
        }
        catch (Exception ex)
        {
            return TeacherPayoutTransferResult.Fail(ex.Message);
        }
    }
}
