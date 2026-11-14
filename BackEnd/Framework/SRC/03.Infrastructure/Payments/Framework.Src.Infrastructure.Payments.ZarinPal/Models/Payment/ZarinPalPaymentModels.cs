namespace Framework.Src.Infrastructure.Payments.ZarinPal.Models.Payment;

/// <summary>
/// درخواست ایجاد تراکنش پرداخت (REST — payment/request.json).
/// </summary>
public sealed class ZarinPalPaymentRequest
{
    /// <summary>
    /// مبلغ به ریال.
    /// </summary>
    public required long Amount { get; init; }

    /// <summary>
    /// آدرس بازگشت کاربر پس از پرداخت.
    /// </summary>
    public required string CallbackUrl { get; init; }

    /// <summary>
    /// توضیحات تراکنش.
    /// </summary>
    public required string Description { get; init; }

    /// <summary>
    /// شماره موبایل پرداخت‌کننده (اختیاری).
    /// </summary>
    public string? Mobile { get; init; }

    /// <summary>
    /// ایمیل پرداخت‌کننده (اختیاری).
    /// </summary>
    public string? Email { get; init; }

    /// <summary>
    /// شناسه سفارش داخلی (در metadata ذخیره می‌شود).
    /// </summary>
    public string? OrderId { get; init; }

    /// <summary>
    /// شناسه معرف (referrer_id) — اختیاری.
    /// </summary>
    public string? ReferrerId { get; init; }

    /// <summary>
    /// شماره کارت برای پرداخت اختصاصی (اختیاری).
    /// </summary>
    public string? CardPan { get; init; }
}

/// <summary>
/// پاسخ ایجاد تراکنش پرداخت.
/// </summary>
public sealed class ZarinPalPaymentRequestResult
{
    /// <summary>
    /// کد پاسخ (۱۰۰ = موفق).
    /// </summary>
    public int Code { get; init; }

    /// <summary>
    /// پیام پاسخ.
    /// </summary>
    public string Message { get; init; } = string.Empty;

    /// <summary>
    /// کد Authority یکتا برای هدایت کاربر به درگاه.
    /// </summary>
    public string Authority { get; init; } = string.Empty;

    /// <summary>
    /// نوع کارمزد (Merchant / Payer).
    /// </summary>
    public string? FeeType { get; init; }

    /// <summary>
    /// مبلغ کارمزد.
    /// </summary>
    public long? Fee { get; init; }

    /// <summary>
    /// آدرس کامل هدایت کاربر به درگاه.
    /// </summary>
    public string PaymentUrl { get; init; } = string.Empty;
}

/// <summary>
/// درخواست تأیید پرداخت (REST — payment/verify.json).
/// </summary>
public sealed class ZarinPalPaymentVerifyRequest
{
    /// <summary>
    /// مبلغ تراکنش به ریال (باید با مبلغ اولیه یکسان باشد).
    /// </summary>
    public required long Amount { get; init; }

    /// <summary>
    /// کد Authority دریافتی از callback.
    /// </summary>
    public required string Authority { get; init; }
}

/// <summary>
/// نتیجه تأیید پرداخت.
/// </summary>
public sealed class ZarinPalPaymentVerifyResult
{
    /// <summary>
    /// آیا پرداخت موفق بود (کد ۱۰۰ یا ۱۰۱).
    /// </summary>
    public bool IsSuccess { get; init; }

    /// <summary>
    /// کد پاسخ زرین‌پال.
    /// </summary>
    public int Code { get; init; }

    /// <summary>
    /// پیام پاسخ.
    /// </summary>
    public string Message { get; init; } = string.Empty;

    /// <summary>
    /// شماره مرجع تراکنش (ref_id).
    /// </summary>
    public long? ReferenceId { get; init; }

    /// <summary>
    /// شماره کارت ماسک‌شده.
    /// </summary>
    public string? CardPan { get; init; }

    /// <summary>
    /// هش کارت.
    /// </summary>
    public string? CardHash { get; init; }

    /// <summary>
    /// نوع کارمزد.
    /// </summary>
    public string? FeeType { get; init; }

    /// <summary>
    /// مبلغ کارمزد.
    /// </summary>
    public long? Fee { get; init; }
}

/// <summary>
/// وضعیت بازگشت از درگاه در QueryString.
/// </summary>
public static class ZarinPalCallbackStatus
{
    /// <summary>
    /// پرداخت موفق — قابل verify.
    /// </summary>
    public const string Ok = "OK";

    /// <summary>
    /// پرداخت ناموفق یا لغو شده.
    /// </summary>
    public const string Nok = "NOK";
}
