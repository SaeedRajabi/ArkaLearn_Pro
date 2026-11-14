using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.Contracts.Finance;
using ArkaSoftwarePro.Src.Core.Contracts.Finance.FinanceRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Finance.WalletRepositoryContracts;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.FinanceAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.RequestTeacherPayout;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Commands;

public class RequestTeacherPayoutCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherFinanceCommandRepository financeCommandRepository,
    ITeacherCommandRepository teacherCommandRepository,
    IUserCommandRepository userCommandRepository,
    IStudentCommandRepository studentCommandRepository,
    ITeacherPayoutTransferService payoutTransferService,
    IUserWalletRepository userWalletRepository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<RequestTeacherPayoutCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(RequestTeacherPayoutCommand command)
    {
        var userId = ResolveUserId();
        if (userId <= 0)
            return await ResultAsync("User not authenticated.", ApplicationServiceStatus.NotFound);

        var teacher = await TeacherProfileProvisioner.EnsureTeacherRecordAsync(
            userId, userCommandRepository, teacherCommandRepository, studentCommandRepository);
        if (teacher == null)
            return await ResultAsync("Teacher not found.", ApplicationServiceStatus.NotFound);

        if (!teacher.HasCompletePayoutBankInfo())
            return await ResultAsync(
                "Please enter your Sheba (IBAN) and card number in your profile before requesting a payout.",
                ApplicationServiceStatus.ValidationError);

        var settings = await financeCommandRepository.GetOrCreateSettingsAsync();
        if (!settings.IsPayoutGatewayConfigured())
            return await ResultAsync(
                "Platform payout bank settings are not configured. Contact support.",
                ApplicationServiceStatus.ValidationError);

        var wallet = await financeCommandRepository.GetOrCreateWalletAsync(teacher.Id);
        var userWallet = await userWalletRepository.GetOrCreateByUserIdAsync(userId);

        if (wallet.LastPayoutRequestedAtUtc.HasValue)
        {
            var nextEligible = wallet.LastPayoutRequestedAtUtc.Value.AddHours(settings.PayoutCooldownHours);
            if (DateTime.UtcNow < nextEligible)
                return await ResultAsync(
                    $"You can request another payout after {nextEligible:yyyy-MM-dd HH:mm} UTC.",
                    ApplicationServiceStatus.ValidationError);
        }

        if (wallet.ReservedBalanceToman > 0)
            return await ResultAsync("You already have a pending payout request.", ApplicationServiceStatus.ValidationError);

        var amount = command.AmountToman > 0 ? command.AmountToman : userWallet.AvailableBalanceToman;
        if (amount <= 0)
            return await ResultAsync("No available balance to withdraw.", ApplicationServiceStatus.ValidationError);
        if (amount > userWallet.AvailableBalanceToman || amount > wallet.AvailableBalanceToman)
            return await ResultAsync("Requested amount exceeds available balance.", ApplicationServiceStatus.ValidationError);

        try
        {
            wallet.ReserveForPayout(amount);
            userWallet.ReserveForWithdrawal(amount);
        }
        catch (InvalidOperationException ex)
        {
            return await ResultAsync(ex.Message, ApplicationServiceStatus.ValidationError);
        }

        var request = TeacherPayoutRequest.Create(teacher.Id, amount, command.Note);
        await financeCommandRepository.InsertPayoutRequestAsync(request);
        settings.DebitPayout(amount);
        await financeCommandRepository.SaveSettingsAsync(settings);

        var transfer = await payoutTransferService.TransferToTeacherAsync(
            teacher.PayoutSheba!,
            teacher.ZarinPalBankAccountId,
            amount);

        if (!transfer.Success)
        {
            wallet.RejectPayout(amount);
            userWallet.RejectWithdrawal(amount);
            request.MarkRejected(transfer.ErrorMessage ?? "Payout transfer failed.");
            settings.CreditPayoutReversal(amount);
            await financeCommandRepository.SaveSettingsAsync(settings);
            await financeCommandRepository.CommitAsync();
            await teacherCommandRepository.CommitAsync();
            return await ResultAsync(transfer.ErrorMessage ?? "Payout transfer failed.", ApplicationServiceStatus.ValidationError);
        }

        if (!string.IsNullOrWhiteSpace(transfer.ZarinPalBankAccountId))
            teacher.SetZarinPalBankAccountId(transfer.ZarinPalBankAccountId);

        wallet.CompletePayout(amount);
        userWallet.CompleteWithdrawal(amount);
        request.MarkPaid(transfer.TransferReference, "ZarinPal instant payout");

        await financeCommandRepository.CommitAsync();
        await teacherCommandRepository.CommitAsync();

        return await ResultAsync("Payout transferred successfully.", ApplicationServiceStatus.Ok);
    }

    private long ResolveUserId()
    {
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier || x.Type == "userId" || x.Type == "nameid");
        return claim != null && long.TryParse(claim.Value, out var id) ? id : 0;
    }
}
