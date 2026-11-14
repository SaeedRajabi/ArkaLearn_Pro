using ArkaSoftwarePro.Src.Core.Contracts.Finance;
using ArkaSoftwarePro.Src.Core.Contracts.Finance.WalletRepositoryContracts;
using ArkaSoftwarePro.Src.Core.Contracts.Invoices.InvoiceRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Seminars.SeminarRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.FinanceAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.FinanceAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Invoices.Commands.AddTransaction;
using ArkaSoftwarePro.Src.Core.RequestResponse.Invoices.Queries.GetMyInvoices;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Commands.RegisterUserForSeminar;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetMyRegisteredSeminars;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetSeminarById;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.Contracts.ApplicationService.Commands;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.WalletServices;

public class UserWalletService(
    IUserWalletRepository walletRepository,
    IInvoiceQueryRepository invoiceQueryRepository,
    ISeminarQueriesRepository seminarQueriesRepository,
    ICommandDispatcher commandDispatcher, IBusinessTransactionRunner transactions)
{
    public Task<UserWallet> EnsureWalletAsync(long userId, CancellationToken cancellationToken = default)
        => walletRepository.GetOrCreateByUserIdAsync(userId, cancellationToken);

    public async Task<(bool Success, string Message)> CreditTopUpAsync(
        long userId,
        long amountToman,
        string reference,
        string? description,
        CancellationToken cancellationToken = default)
    {
        if (amountToman <= 0)
            return (false, "Invalid top-up amount.");

        if (await walletRepository.TopUpReferenceExistsAsync(reference, cancellationToken))
            return (true, "Top-up already processed.");

        var wallet = await walletRepository.GetOrCreateByUserIdAsync(userId, cancellationToken);
        wallet.CreditTopUp(amountToman);
        await walletRepository.InsertTransactionAsync(
            WalletTransaction.Create(
                wallet.Id,
                userId,
                WalletTransactionType.TopUp,
                amountToman,
                wallet.AvailableBalanceToman,
                reference,
                description),
            cancellationToken);
        await walletRepository.CommitAsync(cancellationToken);
        return (true, "Wallet topped up.");
    }

    public Task<(bool Success, string Message, string? ReferenceNumber)> PayInvoiceFromWalletAsync(
        long userId, long invoiceId, CancellationToken cancellationToken = default) =>
        transactions.RunAsync(() => PayInvoiceFromWalletCoreAsync(userId, invoiceId, cancellationToken), result => result.Success, cancellationToken);

    private async Task<(bool Success, string Message, string? ReferenceNumber)> PayInvoiceFromWalletCoreAsync(
        long userId,
        long invoiceId,
        CancellationToken cancellationToken = default)
    {
        var myInvoices = await invoiceQueryRepository.GetMyInvoicesAsync(new GetMyInvoicesQuery { UserId = userId })
            ?? [];
        var invoice = myInvoices.FirstOrDefault(x => x.Id == invoiceId);
        if (invoice == null)
            return (false, "Invoice not found.", null);

        var status = (invoice.Status ?? string.Empty).Trim().ToUpperInvariant();
        if (status == "PAID")
            return (false, "This invoice has already been paid.", null);
        if (status is "CANCELED" or "CANCELLED")
            return (false, "This invoice is cancelled.", null);

        var amountToman = Convert.ToInt64(Math.Round(invoice.RemainingAmount, MidpointRounding.AwayFromZero));
        if (amountToman <= 0)
            return (false, "There is no remaining amount to pay.", null);

        var reference = $"wallet:invoice:{invoiceId}";
        if (await walletRepository.TopUpReferenceExistsAsync(reference, cancellationToken))
            return (false, "This invoice was already paid from wallet.", null);

        var wallet = await walletRepository.GetOrCreateByUserIdAsync(userId, cancellationToken);
        try
        {
            wallet.DebitPurchase(amountToman);
        }
        catch (InvalidOperationException ex)
        {
            return (false, ex.Message, null);
        }

        await walletRepository.InsertTransactionAsync(
            WalletTransaction.Create(
                wallet.Id,
                userId,
                WalletTransactionType.Purchase,
                amountToman,
                wallet.AvailableBalanceToman,
                reference,
                $"Invoice {invoice.InvoiceNumber}"),
            cancellationToken);

        // Credit company (platform) wallet with the same amount.
        var platform = await walletRepository.GetOrCreatePlatformWalletAsync(cancellationToken);
        platform.CreditReceived(amountToman);
        await walletRepository.InsertTransactionAsync(
            WalletTransaction.Create(
                platform.Id,
                UserWallet.PlatformUserId,
                WalletTransactionType.SaleCredit,
                amountToman,
                platform.AvailableBalanceToman,
                $"{reference}:platform",
                $"Invoice {invoice.InvoiceNumber} company credit"),
            cancellationToken);

        await walletRepository.CommitAsync(cancellationToken);

        var refNumber = $"WALLET-{invoiceId}-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
        var command = new AddTransactionCommand
        {
            InvoiceId = invoiceId,
            Amount = invoice.RemainingAmount,
            ReferenceNumber = refNumber,
            Description = "Wallet payment",
        };

        var result = await commandDispatcher.Send<AddTransactionCommand, string>(command);
        if (result.Status != ApplicationServiceStatus.Ok)
            return (false, string.Join(" ", result.Messages ?? []), null);

        return (true, "Invoice paid from wallet.", refNumber);
    }

    public Task<(bool Success, string Message)> PaySeminarFromWalletAsync(
        long userId, long seminarId, CancellationToken cancellationToken = default) =>
        transactions.RunAsync(() => PaySeminarFromWalletCoreAsync(userId, seminarId, cancellationToken), result => result.Success, cancellationToken);

    private async Task<(bool Success, string Message)> PaySeminarFromWalletCoreAsync(
        long userId,
        long seminarId,
        CancellationToken cancellationToken = default)
    {
        var seminar = await seminarQueriesRepository.GetSeminarByIdExecuteAsync(new GetSeminarByIdQuery { SeminarId = seminarId });
        if (seminar == null)
            return (false, "Seminar not found.");

        if (seminar.IsFree || seminar.Price <= 0)
            return (false, "This seminar does not require payment.");

        var registrations = await seminarQueriesRepository.GetMyRegisteredSeminarsAsync(new GetMyRegisteredSeminarsQuery { UserId = userId });
        if (registrations.Any(x => x.SeminarId == seminarId && x.HasPaid))
            return (false, "You are already registered for this seminar.");

        var amountToman = Convert.ToInt64(Math.Round(seminar.Price, MidpointRounding.AwayFromZero));
        var reference = $"wallet:seminar:{seminarId}:user:{userId}";
        if (await walletRepository.TopUpReferenceExistsAsync(reference, cancellationToken))
            return (false, "Seminar already paid from wallet.");

        var wallet = await walletRepository.GetOrCreateByUserIdAsync(userId, cancellationToken);
        try
        {
            wallet.DebitPurchase(amountToman);
        }
        catch (InvalidOperationException ex)
        {
            return (false, ex.Message);
        }

        await walletRepository.InsertTransactionAsync(
            WalletTransaction.Create(
                wallet.Id,
                userId,
                WalletTransactionType.SeminarPurchase,
                amountToman,
                wallet.AvailableBalanceToman,
                reference,
                $"Seminar {seminar.Title}"),
            cancellationToken);
        await walletRepository.CommitAsync(cancellationToken);

        var command = new RegisterUserForSeminarCommand
        {
            SeminarId = seminarId,
            UserId = userId,
            HasPaid = true,
        };

        var result = await commandDispatcher.Send<RegisterUserForSeminarCommand, string>(command);
        if (result.Status != ApplicationServiceStatus.Ok)
            return (false, string.Join(" ", result.Messages ?? []));

        return (true, "Seminar registered and paid from wallet.");
    }

    public async Task CreditTeacherSaleAsync(
        long teacherUserId,
        long netAmountToman,
        string reference,
        string? description,
        CancellationToken cancellationToken = default)
    {
        if (teacherUserId <= 0 || netAmountToman <= 0) return;
        if (await walletRepository.TopUpReferenceExistsAsync(reference, cancellationToken)) return;

        var wallet = await walletRepository.GetOrCreateByUserIdAsync(teacherUserId, cancellationToken);
        wallet.CreditReceived(netAmountToman);
        await walletRepository.InsertTransactionAsync(
            WalletTransaction.Create(
                wallet.Id,
                teacherUserId,
                WalletTransactionType.SaleCredit,
                netAmountToman,
                wallet.AvailableBalanceToman,
                reference,
                description),
            cancellationToken);
    }

    public async Task<(bool Success, string Message)> AdminAdjustAsync(
        long userId,
        long amountToman,
        string? note,
        CancellationToken cancellationToken = default)
    {
        if (userId <= 0)
            return (false, "Invalid user.");

        var wallet = await walletRepository.GetOrCreateByUserIdAsync(userId, cancellationToken);
        try
        {
            wallet.AdminAdjust(amountToman);
        }
        catch (InvalidOperationException ex)
        {
            return (false, ex.Message);
        }

        var type = amountToman >= 0 ? WalletTransactionType.AdminCredit : WalletTransactionType.AdminDebit;
        var reference = $"admin:adjust:{userId}:{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";
        await walletRepository.InsertTransactionAsync(
            WalletTransaction.Create(
                wallet.Id,
                userId,
                type,
                Math.Abs(amountToman),
                wallet.AvailableBalanceToman,
                reference,
                note),
            cancellationToken);
        await walletRepository.CommitAsync(cancellationToken);
        return (true, "Wallet balance adjusted.");
    }
}
