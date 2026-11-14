using Framework.Src.Infrastructure.Payments.ZarinPal.Models.GraphQl;
using Framework.Src.Infrastructure.Payments.ZarinPal.Models.Payment;

namespace Framework.Src.Infrastructure.Payments.ZarinPal.Abstractions;

/// <summary>
/// قرارداد اصلی کتابخانه زرین‌پال؛ شامل درگاه REST و API گرافیکی پنل.
/// </summary>
public interface IZarinPalClient
{
    #region درگاه پرداخت REST

    /// <summary>
    /// ایجاد تراکنش و دریافت Authority و آدرس هدایت به درگاه.
    /// </summary>
    Task<ZarinPalPaymentRequestResult> RequestPaymentAsync(
        ZarinPalPaymentRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// تأیید پرداخت پس از بازگشت کاربر (فقط وقتی Status=OK).
    /// </summary>
    Task<ZarinPalPaymentVerifyResult> VerifyPaymentAsync(
        ZarinPalPaymentVerifyRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// ساخت URL هدایت کاربر به درگاه با Authority.
    /// </summary>
    string BuildPaymentGatewayUrl(string authority);

    #endregion

    #region GraphQL — Session

    /// <summary>
    /// دریافت لیست Sessionهای یک ترمینال.
    /// </summary>
    Task<IReadOnlyList<ZarinPalSession>> GetSessionsAsync(
        string terminalId,
        ZarinPalSessionFilter? filter = null,
        int? limit = null,
        int? offset = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// جستجوی Session با فیلترهای پیشرفته.
    /// </summary>
    Task<IReadOnlyList<ZarinPalSession>> SearchSessionsAsync(
        ZarinPalSessionSearchFilter filter,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// دریافت جزئیات یک Session شامل timeline استرداد.
    /// </summary>
    Task<ZarinPalSession?> GetSessionByIdAsync(
        string terminalId,
        string sessionId,
        CancellationToken cancellationToken = default);

    #endregion

    #region GraphQL — Reconciliation

    /// <summary>
    /// دریافت لیست تسویه‌ها (Reconciliation).
    /// </summary>
    Task<IReadOnlyList<ZarinPalReconciliation>> GetReconciliationsAsync(
        ZarinPalReconciliationSearchFilter filter,
        CancellationToken cancellationToken = default);

    #endregion

    #region GraphQL — BankAccount & Terminal

    /// <summary>
    /// دریافت حساب‌های بانکی ثبت‌شده.
    /// </summary>
    Task<IReadOnlyList<ZarinPalBankAccount>> GetBankAccountsAsync(
        int? limit = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// افزودن حساب بانکی جدید.
    /// </summary>
    Task<ZarinPalBankAccount> AddBankAccountAsync(
        ZarinPalBankAccountAddRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// دریافت ترمینال‌های پذیرنده.
    /// </summary>
    Task<IReadOnlyList<ZarinPalTerminal>> GetTerminalsAsync(
        CancellationToken cancellationToken = default);

    /// <summary>
    /// ایجاد ترمینال جدید.
    /// </summary>
    Task<ZarinPalTerminal> AddTerminalAsync(
        ZarinPalTerminalAddRequest request,
        CancellationToken cancellationToken = default);

    #endregion

    #region GraphQL — Invoice

    /// <summary>
    /// ایجاد فاکتور (Invoice) و دریافت لینک پرداخت.
    /// </summary>
    Task<ZarinPalInvoice> AddInvoiceAsync(
        ZarinPalInvoiceAddRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// دریافت فاکتور(ها) بر اساس شناسه ترمینال و فاکتور.
    /// </summary>
    Task<IReadOnlyList<ZarinPalInvoice>> GetInvoicesAsync(
        string terminalId,
        string? invoiceId = null,
        CancellationToken cancellationToken = default);

    #endregion

    #region GraphQL — Refund & Payout

    /// <summary>
    /// ثبت درخواست استرداد وجه (Refund).
    /// </summary>
    Task<ZarinPalRefundResult> AddRefundAsync(
        ZarinPalRefundRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// ثبت تسویه به حساب بانکی (Payout).
    /// </summary>
    Task<ZarinPalPayout> AddPayoutAsync(
        ZarinPalPayoutAddRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// ثبت تسویه آنی (Instant Payout).
    /// </summary>
    Task<ZarinPalInstantPayout> AddInstantPayoutAsync(
        ZarinPalInstantPayoutAddRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// دریافت جزئیات تسویه آنی.
    /// </summary>
    Task<ZarinPalInstantPayout?> GetInstantPayoutAsync(
        string terminalId,
        string payoutId,
        CancellationToken cancellationToken = default);

    #endregion
}

/// <summary>
/// فیلتر جستجوی Session.
/// </summary>
public sealed class ZarinPalSessionSearchFilter
{
    public string? TerminalId { get; init; }
    public string? Id { get; init; }
    public string? ReferenceId { get; init; }
    public string? CardPan { get; init; }
    public string? Description { get; init; }
    public string? Mobile { get; init; }
    public string? Email { get; init; }
    public string? Rrn { get; init; }
}

/// <summary>
/// فیلتر جستجوی Reconciliation.
/// </summary>
public sealed class ZarinPalReconciliationSearchFilter
{
    public required string TerminalId { get; init; }
    public ZarinPalReconciliationFilter Filter { get; init; } = ZarinPalReconciliationFilter.All;
    public string? Id { get; init; }
    public string? ReferenceId { get; init; }
    public DateTime? CreatedFromDate { get; init; }
    public DateTime? CreatedToDate { get; init; }
}

/// <summary>
/// درخواست افزودن حساب بانکی.
/// </summary>
public sealed class ZarinPalBankAccountAddRequest
{
    public required string Iban { get; init; }
    public required bool IsLegal { get; init; }
    public string? Type { get; init; }
}

/// <summary>
/// درخواست ایجاد ترمینال.
/// </summary>
public sealed class ZarinPalTerminalAddRequest
{
    public required string MccId { get; init; }
    public required string Domain { get; init; }
    public required string SupportPhone { get; init; }
    public required string Name { get; init; }
    public required string BankAccountId { get; init; }
}

/// <summary>
/// درخواست ایجاد فاکتور.
/// </summary>
public sealed class ZarinPalInvoiceAddRequest
{
    public required string TerminalId { get; init; }
    public required long Amount { get; init; }
    public required string Description { get; init; }
    public required string CallbackUrl { get; init; }
    public required string PayerName { get; init; }
    public required string PayerMobile { get; init; }
    public string? PayerEmail { get; init; }
    public string? Note { get; init; }
    public string FeeType { get; init; } = "PAYER";
    public string NotifyType { get; init; } = "MOBILE";
}

/// <summary>
/// درخواست استرداد.
/// </summary>
public sealed class ZarinPalRefundRequest
{
    public required string SessionId { get; init; }
    public required long Amount { get; init; }
    public string? Description { get; init; }
    public ZarinPalRefundMethod Method { get; init; } = ZarinPalRefundMethod.Paya;
    public ZarinPalRefundReason Reason { get; init; } = ZarinPalRefundReason.CustomerRequest;
}

/// <summary>
/// درخواست تسویه عادی.
/// </summary>
public sealed class ZarinPalPayoutAddRequest
{
    public required string TerminalId { get; init; }
    public required string BankAccountId { get; init; }
    public required long Amount { get; init; }
    public string? Description { get; init; }
    public string? ReconciliationParts { get; init; }
}

/// <summary>
/// درخواست تسویه آنی.
/// </summary>
public sealed class ZarinPalInstantPayoutAddRequest
{
    public required string TerminalId { get; init; }
    public required string BankAccountId { get; init; }
    public required long Amount { get; init; }
}
