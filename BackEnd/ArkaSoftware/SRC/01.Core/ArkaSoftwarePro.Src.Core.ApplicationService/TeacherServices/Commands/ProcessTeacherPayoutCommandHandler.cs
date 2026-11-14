using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.Contracts.Finance;
using ArkaSoftwarePro.Src.Core.Contracts.Finance.FinanceRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.FinanceAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.ProcessTeacherPayout;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Commands;

public class ProcessTeacherPayoutCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherFinanceCommandRepository financeCommandRepository,
    ITeacherCommandRepository teacherCommandRepository,
    ITeacherPayoutTransferService payoutTransferService,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<ProcessTeacherPayoutCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(ProcessTeacherPayoutCommand command)
    {
        if (!IsAdminUser())
            return await ResultAsync("Unauthorized.", ApplicationServiceStatus.NotFound);

        if (command.PayoutId <= 0)
            return await ResultAsync("Invalid payout id.", ApplicationServiceStatus.ValidationError);

        var action = command.Action?.Trim().ToLowerInvariant();
        if (action is not ("approve" or "reject"))
            return await ResultAsync("Action must be approve or reject.", ApplicationServiceStatus.ValidationError);

        var payout = await financeCommandRepository.GetPayoutByIdAsync(command.PayoutId);
        if (payout == null)
            return await ResultAsync("Payout request not found.", ApplicationServiceStatus.NotFound);

        if (payout.Status != TeacherPayoutStatus.Pending)
            return await ResultAsync("Only pending payout requests can be processed.", ApplicationServiceStatus.ValidationError);

        var wallet = await financeCommandRepository.GetOrCreateWalletAsync(payout.TeacherId);
        var settings = await financeCommandRepository.GetOrCreateSettingsAsync();
        var amount = payout.AmountToman;

        try
        {
            if (action == "approve")
            {
                var teacher = await teacherCommandRepository.GetByIdWithDetailsAsync(payout.TeacherId);
                if (teacher == null || !teacher.HasCompletePayoutBankInfo())
                    return await ResultAsync("Teacher payout bank info is incomplete.", ApplicationServiceStatus.ValidationError);

                string? transferReference = command.TransferReference?.Trim();
                if (string.IsNullOrWhiteSpace(transferReference))
                {
                    var transfer = await payoutTransferService.TransferToTeacherAsync(
                        teacher.PayoutSheba!,
                        teacher.ZarinPalBankAccountId,
                        amount);
                    if (!transfer.Success)
                        return await ResultAsync(transfer.ErrorMessage ?? "Payout transfer failed.", ApplicationServiceStatus.ValidationError);

                    transferReference = transfer.TransferReference;
                    if (!string.IsNullOrWhiteSpace(transfer.ZarinPalBankAccountId))
                        teacher.SetZarinPalBankAccountId(transfer.ZarinPalBankAccountId);
                }

                wallet.CompletePayout(amount);
                payout.MarkPaid(transferReference, command.AdminNote);
            }
            else
            {
                wallet.RejectPayout(amount);
                payout.MarkRejected(command.AdminNote);
                settings.CreditPayoutReversal(amount);
                await financeCommandRepository.SaveSettingsAsync(settings);
            }
        }
        catch (InvalidOperationException ex)
        {
            return await ResultAsync(ex.Message, ApplicationServiceStatus.ValidationError);
        }

        await financeCommandRepository.CommitAsync();
        await teacherCommandRepository.CommitAsync();

        return await ResultAsync(
            action == "approve" ? "Payout marked as paid." : "Payout request rejected.",
            ApplicationServiceStatus.Ok);
    }

    private bool IsAdminUser()
    {
        var roleClaim = httpContextAccessor.HttpContext?.User?.Claims?
            .FirstOrDefault(x => x.Type == ClaimTypes.Role)?.Value;
        return roleClaim?.ToLowerInvariant() is "3" or "admin" or "super admin";
    }
}
