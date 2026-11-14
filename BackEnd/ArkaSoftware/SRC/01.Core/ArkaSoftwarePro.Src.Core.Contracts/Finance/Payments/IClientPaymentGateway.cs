using System.Threading;
using System.Threading.Tasks;

namespace ArkaSoftwarePro.Src.Core.Contracts.Finance.Payments
{
    public interface IClientPaymentGateway
    {
        Task<PaymentStartResult> CreatePaymentAsync(PaymentStartRequest request, CancellationToken cancellationToken = default);
        Task<PaymentVerifyResult> VerifyPaymentAsync(PaymentVerifyRequest request, CancellationToken cancellationToken = default);
    }

    public sealed record PaymentStartRequest(
        string OrderId,
        long Amount,
        string CallbackUrl,
        string Description,
        string? Name,
        string? Email,
        string? PhoneNumber);

    public sealed record PaymentStartResult(
        string PaymentId,
        string PaymentUrl);

    public sealed record PaymentVerifyRequest(
        string PaymentId,
        string OrderId,
        long? Amount = null);

    public sealed record PaymentVerifyResult(
        bool Success,
        string Message,
        long Amount,
        string? ReferenceNumber,
        string? CardNumber,
        string? PaymentId,
        string? OrderId = null);
}
