namespace Framework.Src.Infrastructure.Payments.Zibal.Models.Payment;



/// <summary>

/// درخواست ایجاد تراکنش (POST /v1/request).

/// </summary>

public sealed class ZibalPaymentRequest

{

    /// <summary>

    /// مبلغ به ریال.

    /// </summary>

    public required long Amount { get; init; }



    /// <summary>

    /// آدرس callback پذیرنده.

    /// </summary>

    public required string CallbackUrl { get; init; }



    /// <summary>

    /// توضیحات تراکنش.

    /// </summary>

    public required string Description { get; init; }



    /// <summary>

    /// شناسه سفارش داخلی (اختیاری).

    /// </summary>

    public string? OrderId { get; init; }



    /// <summary>

    /// موبایل پرداخت‌کننده (اختیاری).

    /// </summary>

    public string? Mobile { get; init; }

}



/// <summary>

/// پاسخ ایجاد تراکنش.

/// </summary>

public sealed class ZibalPaymentRequestResult

{

    public int Result { get; init; }

    public string Message { get; init; } = string.Empty;

    public long TrackId { get; init; }

    public string PaymentUrl { get; init; } = string.Empty;

}



/// <summary>

/// درخواست تأیید پرداخت (POST /v1/verify).

/// </summary>

public sealed class ZibalPaymentVerifyRequest

{

    public required long TrackId { get; init; }

}



/// <summary>

/// نتیجه تأیید پرداخت.

/// </summary>

public sealed class ZibalPaymentVerifyResult

{

    public bool IsSuccess { get; init; }

    public int Result { get; init; }

    public string Message { get; init; } = string.Empty;

    public long Amount { get; init; }

    public int? Status { get; init; }

    public string? RefNumber { get; init; }

    public string? CardNumber { get; init; }

    public string? OrderId { get; init; }

    public string? PaidAt { get; init; }

}



/// <summary>

/// درخواست استعلام پرداخت (POST /v1/inquiry).

/// </summary>

public sealed class ZibalPaymentInquiryRequest

{

    public required long TrackId { get; init; }

}



/// <summary>

/// نتیجه استعلام پرداخت.

/// </summary>

public sealed class ZibalPaymentInquiryResult

{

    public int Result { get; init; }

    public string Message { get; init; } = string.Empty;

    public long Amount { get; init; }

    public int? Status { get; init; }

    public string? RefNumber { get; init; }

    public string? CardNumber { get; init; }

    public string? OrderId { get; init; }

    public string? PaidAt { get; init; }

    public string? VerifiedAt { get; init; }

}



/// <summary>

/// ثابت‌های callback استاندارد زیبال (متد GET).

/// </summary>

public static class ZibalCallbackParameters

{

    public const string TrackId = "trackId";

    public const string Success = "success";

    public const string Status = "status";

    public const string OrderId = "orderId";

}



public static class ZibalResultCodes

{

    public const int Success = 100;

    public const int AlreadyVerified = 201;

}


