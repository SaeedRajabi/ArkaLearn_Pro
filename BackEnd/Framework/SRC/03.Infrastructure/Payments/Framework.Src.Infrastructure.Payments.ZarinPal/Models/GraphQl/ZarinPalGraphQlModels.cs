namespace Framework.Src.Infrastructure.Payments.ZarinPal.Models.GraphQl;

/// <summary>
/// یک نشست پرداخت (Session) در پنل زرین‌پال.
/// </summary>
public sealed class ZarinPalSession
{
    public string Id { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public long Amount { get; init; }
    public string? Description { get; init; }
    public DateTimeOffset? CreatedAt { get; init; }
    public IReadOnlyList<ZarinPalSessionTry> SessionTries { get; init; } = Array.Empty<ZarinPalSessionTry>();
}

/// <summary>
/// جزئیات تلاش پرداخت در یک Session.
/// </summary>
public sealed class ZarinPalSessionTry
{
    public string Id { get; init; } = string.Empty;
    public string SessionId { get; init; } = string.Empty;
    public string? PaymentId { get; init; }
    public string? PayerIp { get; init; }
    public int? InitTime { get; init; }
    public int? VerifyTime { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? Rrn { get; init; }
    public string? CardPan { get; init; }
    public bool? IsCardMobileVerified { get; init; }
    public DateTimeOffset? CreatedAt { get; init; }
}

/// <summary>
/// تسویه (Reconciliation) در پنل زرین‌پال.
/// </summary>
public sealed class ZarinPalReconciliation
{
    public string Id { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public long Amount { get; init; }
    public DateTimeOffset? PayableAt { get; init; }
    public string? ReferenceId { get; init; }
    public DateTimeOffset? ReconciledAt { get; init; }
}

/// <summary>
/// حساب بانکی ثبت‌شده در زرین‌پال.
/// </summary>
public sealed class ZarinPalBankAccount
{
    public string Id { get; init; } = string.Empty;
    public string Iban { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public bool IsLegal { get; init; }
    public string? HolderName { get; init; }
    public string? Type { get; init; }
    public ZarinPalIssuingBank? IssuingBank { get; init; }
}

/// <summary>
/// بانک صادرکننده.
/// </summary>
public sealed class ZarinPalIssuingBank
{
    public string Name { get; init; } = string.Empty;
    public string Slug { get; init; } = string.Empty;
}

/// <summary>
/// ترمینال (درگاه) پذیرنده.
/// </summary>
public sealed class ZarinPalTerminal
{
    public string Id { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string? PreferredBankAccountId { get; init; }
    public string? Domain { get; init; }
    public string? SupportPhone { get; init; }
    public string? Key { get; init; }
    public string? Name { get; init; }
    public string? Logo { get; init; }
    public DateTimeOffset? CreatedAt { get; init; }
    public DateTimeOffset? UpdatedAt { get; init; }
}

/// <summary>
/// فاکتور (Invoice) زرین‌پال.
/// </summary>
public sealed class ZarinPalInvoice
{
    public string Id { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public long Amount { get; init; }
    public long? Fee { get; init; }
    public string? Description { get; init; }
    public IReadOnlyList<ZarinPalInvoiceSession> Sessions { get; init; } = Array.Empty<ZarinPalInvoiceSession>();

    /// <summary>
    /// لینک پرداخت فاکتور برای ارسال به کاربر.
    /// </summary>
    public string BuildInvoicePaymentUrl()
        => string.IsNullOrWhiteSpace(Id) ? string.Empty : $"https://zarinp.al/invoice/{Id}";
}

/// <summary>
/// نشست مرتبط با فاکتور.
/// </summary>
public sealed class ZarinPalInvoiceSession
{
    public string Id { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public long Amount { get; init; }
    public string? OrderId { get; init; }
}

/// <summary>
/// نتیجه استرداد وجه (Refund).
/// </summary>
public sealed class ZarinPalRefundResult
{
    public string TerminalId { get; init; } = string.Empty;
    public string Id { get; init; } = string.Empty;
    public long Amount { get; init; }
    public ZarinPalRefundTimeline? Timeline { get; init; }
}

/// <summary>
/// زمان‌بندی استرداد.
/// </summary>
public sealed class ZarinPalRefundTimeline
{
    public long? RefundAmount { get; init; }
    public DateTimeOffset? RefundTime { get; init; }
    public string? RefundStatus { get; init; }
}

/// <summary>
/// تسویه آنی (Instant Payout).
/// </summary>
public sealed class ZarinPalInstantPayout
{
    public string Id { get; init; } = string.Empty;
    public string? UrlCode { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? Description { get; init; }
    public long Amount { get; init; }
    public long? Fee { get; init; }
    public string? ReferenceId { get; init; }
    public DateTimeOffset? ReconciledAt { get; init; }
    public DateTimeOffset? CreatedAt { get; init; }
    public DateTimeOffset? UpdatedAt { get; init; }
}

/// <summary>
/// تسویه عادی (Payout).
/// </summary>
public sealed class ZarinPalPayout
{
    public string Id { get; init; } = string.Empty;
    public string? UrlCode { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? Description { get; init; }
    public long Amount { get; init; }
    public int? Percent { get; init; }
    public string? ReconciliationParts { get; init; }
    public DateTimeOffset? CreatedAt { get; init; }
    public DateTimeOffset? UpdatedAt { get; init; }
}

/// <summary>
/// فیلتر وضعیت Session.
/// </summary>
public enum ZarinPalSessionFilter
{
  All,
  Paid,
  Verified,
  Trash,
  Active,
  Refunded
}

/// <summary>
/// فیلتر تسویه.
/// </summary>
public enum ZarinPalReconciliationFilter
{
  All,
  Paid,
  InProgress,
  Reversed
}

/// <summary>
/// روش استرداد.
/// </summary>
public enum ZarinPalRefundMethod
{
  Paya,
  Card
}

/// <summary>
/// دلیل استرداد.
/// </summary>
public enum ZarinPalRefundReason
{
  CustomerRequest,
  DuplicateTransaction,
  SuspiciousTransaction,
  Other
}
