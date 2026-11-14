using ArkaSoftwarePro.Src.Core.Contracts.Finance;
using Framework.Src.Infrastructure.Payments.ZarinPal.Abstractions;
using Framework.Src.Infrastructure.Payments.ZarinPal.Clients;
using Framework.Src.Infrastructure.Payments.ZarinPal.Models.GraphQl;
using Framework.Src.Infrastructure.Payments.ZarinPal.Models.Payment;
using Framework.Src.Infrastructure.Payments.ZarinPal.Options;
using Microsoft.Extensions.Options;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.Payments;

public sealed class RuntimeZarinPalClientAdapter(
    HttpClient httpClient,
    IPaymentGatewaySettingsCache cache) : IZarinPalClient
{
    public Task<ZarinPalPaymentRequestResult> RequestPaymentAsync(
        ZarinPalPaymentRequest request,
        CancellationToken cancellationToken = default)
        => WithClient(client => client.RequestPaymentAsync(request, cancellationToken), cancellationToken);

    public Task<ZarinPalPaymentVerifyResult> VerifyPaymentAsync(
        ZarinPalPaymentVerifyRequest request,
        CancellationToken cancellationToken = default)
        => WithClient(client => client.VerifyPaymentAsync(request, cancellationToken), cancellationToken);

    public string BuildPaymentGatewayUrl(string authority)
        => WithClientSync(client => client.BuildPaymentGatewayUrl(authority));

    public Task<IReadOnlyList<ZarinPalSession>> GetSessionsAsync(
        string terminalId,
        ZarinPalSessionFilter? filter = null,
        int? limit = null,
        int? offset = null,
        CancellationToken cancellationToken = default)
        => WithClient(client => client.GetSessionsAsync(terminalId, filter, limit, offset, cancellationToken), cancellationToken);

    public Task<IReadOnlyList<ZarinPalSession>> SearchSessionsAsync(
        ZarinPalSessionSearchFilter filter,
        CancellationToken cancellationToken = default)
        => WithClient(client => client.SearchSessionsAsync(filter, cancellationToken), cancellationToken);

    public Task<ZarinPalSession?> GetSessionByIdAsync(
        string terminalId,
        string sessionId,
        CancellationToken cancellationToken = default)
        => WithClient(client => client.GetSessionByIdAsync(terminalId, sessionId, cancellationToken), cancellationToken);

    public Task<IReadOnlyList<ZarinPalReconciliation>> GetReconciliationsAsync(
        ZarinPalReconciliationSearchFilter filter,
        CancellationToken cancellationToken = default)
        => WithClient(client => client.GetReconciliationsAsync(filter, cancellationToken), cancellationToken);

    public Task<IReadOnlyList<ZarinPalBankAccount>> GetBankAccountsAsync(
        int? limit = null,
        CancellationToken cancellationToken = default)
        => WithClient(client => client.GetBankAccountsAsync(limit, cancellationToken), cancellationToken);

    public Task<ZarinPalBankAccount> AddBankAccountAsync(
        ZarinPalBankAccountAddRequest request,
        CancellationToken cancellationToken = default)
        => WithClient(client => client.AddBankAccountAsync(request, cancellationToken), cancellationToken);

    public Task<IReadOnlyList<ZarinPalTerminal>> GetTerminalsAsync(CancellationToken cancellationToken = default)
        => WithClient(client => client.GetTerminalsAsync(cancellationToken), cancellationToken);

    public Task<ZarinPalTerminal> AddTerminalAsync(
        ZarinPalTerminalAddRequest request,
        CancellationToken cancellationToken = default)
        => WithClient(client => client.AddTerminalAsync(request, cancellationToken), cancellationToken);

    public Task<ZarinPalInvoice> AddInvoiceAsync(
        ZarinPalInvoiceAddRequest request,
        CancellationToken cancellationToken = default)
        => WithClient(client => client.AddInvoiceAsync(request, cancellationToken), cancellationToken);

    public Task<IReadOnlyList<ZarinPalInvoice>> GetInvoicesAsync(
        string terminalId,
        string? invoiceId = null,
        CancellationToken cancellationToken = default)
        => WithClient(client => client.GetInvoicesAsync(terminalId, invoiceId, cancellationToken), cancellationToken);

    public Task<ZarinPalRefundResult> AddRefundAsync(
        ZarinPalRefundRequest request,
        CancellationToken cancellationToken = default)
        => WithClient(client => client.AddRefundAsync(request, cancellationToken), cancellationToken);

    public Task<ZarinPalPayout> AddPayoutAsync(
        ZarinPalPayoutAddRequest request,
        CancellationToken cancellationToken = default)
        => WithClient(client => client.AddPayoutAsync(request, cancellationToken), cancellationToken);

    public Task<ZarinPalInstantPayout> AddInstantPayoutAsync(
        ZarinPalInstantPayoutAddRequest request,
        CancellationToken cancellationToken = default)
        => WithClient(client => client.AddInstantPayoutAsync(request, cancellationToken), cancellationToken);

    public Task<ZarinPalInstantPayout?> GetInstantPayoutAsync(
        string terminalId,
        string payoutId,
        CancellationToken cancellationToken = default)
        => WithClient(client => client.GetInstantPayoutAsync(terminalId, payoutId, cancellationToken), cancellationToken);

    private async Task<T> WithClient<T>(
        Func<ZarinPalClient, Task<T>> action,
        CancellationToken cancellationToken)
    {
        var snapshot = await cache.GetSnapshotAsync(cancellationToken);
        var client = new ZarinPalClient(httpClient, Options.Create(PaymentGatewayOptionsMapper.ToZarinPalOptions(snapshot)));
        return await action(client);
    }

    private T WithClientSync<T>(Func<ZarinPalClient, T> action)
    {
        var snapshot = cache.GetSnapshotAsync().AsTask().GetAwaiter().GetResult();
        var client = new ZarinPalClient(httpClient, Options.Create(PaymentGatewayOptionsMapper.ToZarinPalOptions(snapshot)));
        return action(client);
    }
}
