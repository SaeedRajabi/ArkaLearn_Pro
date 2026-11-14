using ArkaSoftwarePro.Src.Core.Contracts.Finance;
using Framework.Src.Infrastructure.Payments.ZarinPal.Abstractions;
using Framework.Src.Infrastructure.Payments.ZarinPal.Models.GraphQl;
using Microsoft.Extensions.Options;
using ArkaSoftwarePro.Src.Core.ApplicationService.PaymentsServices;
using ArkaSoftwarePro.Src.Core.Contracts.Finance.Payments;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Payments;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.Finance;

public sealed class TeacherPayoutTransferService(
    IZarinPalClient zarinPalClient,
    IOptions<PaymentGatewayOptions> paymentOptions) : ITeacherPayoutTransferService
{
    public async Task<TeacherPayoutTransferResult> TransferToTeacherAsync(
        string teacherSheba,
        string? existingZarinPalBankAccountId,
        long amountToman,
        CancellationToken cancellationToken = default)
    {
        var options = paymentOptions.Value;
        if (!options.Enabled || !string.Equals(options.Provider, "ZarinPal", StringComparison.OrdinalIgnoreCase))
            return TeacherPayoutTransferResult.Fail("ZarinPal payment gateway is not enabled.");

        if (string.IsNullOrWhiteSpace(options.TerminalId))
            return TeacherPayoutTransferResult.Fail("ZarinPal terminal id is not configured.");

        if (string.IsNullOrWhiteSpace(options.AccessToken))
            return TeacherPayoutTransferResult.Fail("ZarinPal access token is not configured for payouts.");

        if (amountToman <= 0)
            return TeacherPayoutTransferResult.Fail("Payout amount must be positive.");

        var gatewayAmount = checked((long)decimal.Round(
            amountToman * (decimal)Math.Max(1, options.AmountMultiplier),
            0,
            MidpointRounding.AwayFromZero));

        try
        {
            var bankAccountId = existingZarinPalBankAccountId;
            if (string.IsNullOrWhiteSpace(bankAccountId))
            {
                var created = await zarinPalClient.AddBankAccountAsync(new ZarinPalBankAccountAddRequest
                {
                    Iban = teacherSheba,
                    IsLegal = false,
                }, cancellationToken);

                if (string.IsNullOrWhiteSpace(created.Id))
                    return TeacherPayoutTransferResult.Fail("Could not register teacher bank account in ZarinPal.");

                bankAccountId = created.Id;
            }

            var payout = await zarinPalClient.AddInstantPayoutAsync(new ZarinPalInstantPayoutAddRequest
            {
                TerminalId = options.TerminalId.Trim(),
                BankAccountId = bankAccountId,
                Amount = gatewayAmount,
            }, cancellationToken);

            var reference = !string.IsNullOrWhiteSpace(payout.ReferenceId)
                ? payout.ReferenceId
                : payout.Id;

            if (string.IsNullOrWhiteSpace(reference))
                return TeacherPayoutTransferResult.Fail("ZarinPal payout completed without a reference id.");

            return TeacherPayoutTransferResult.Ok(reference, bankAccountId);
        }
        catch (Exception ex)
        {
            return TeacherPayoutTransferResult.Fail(ex.Message);
        }
    }
}
