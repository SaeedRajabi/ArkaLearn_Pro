using Framework.Src.Infrastructure.Payments.Zibal.Models.Payment;



namespace Framework.Src.Infrastructure.Payments.Zibal.Abstractions;



/// <summary>

/// قرارداد کلاینت درگاه پرداخت زیبال (IPG REST).

/// </summary>

public interface IZibalClient

{

    /// <summary>

    /// ثبت سفارش و دریافت trackId (POST /v1/request).

    /// </summary>

    Task<ZibalPaymentRequestResult> RequestPaymentAsync(

        ZibalPaymentRequest request,

        CancellationToken cancellationToken = default);



    /// <summary>

    /// تأیید پرداخت پس از بازگشت کاربر (POST /v1/verify).

    /// </summary>

    Task<ZibalPaymentVerifyResult> VerifyPaymentAsync(

        ZibalPaymentVerifyRequest request,

        CancellationToken cancellationToken = default);



    /// <summary>

    /// استعلام وضعیت پرداخت (POST /v1/inquiry).

    /// </summary>

    Task<ZibalPaymentInquiryResult> InquiryPaymentAsync(

        ZibalPaymentInquiryRequest request,

        CancellationToken cancellationToken = default);



    /// <summary>

    /// ساخت URL هدایت کاربر به صفحه پرداخت (GET /start/{trackId}).

    /// </summary>

    string BuildPaymentGatewayUrl(long trackId);

}


