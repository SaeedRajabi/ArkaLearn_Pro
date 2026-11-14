using System.Net.Http.Json;

using System.Text.Json;

using System.Text.Json.Serialization;

using Framework.Src.Infrastructure.Payments.Zibal.Abstractions;

using Framework.Src.Infrastructure.Payments.Zibal.Exceptions;

using Framework.Src.Infrastructure.Payments.Zibal.Models.Payment;

using Framework.Src.Infrastructure.Payments.Zibal.Options;

using Microsoft.Extensions.Options;



namespace Framework.Src.Infrastructure.Payments.Zibal.Clients;



/// <summary>

/// پیاده‌سازی کلاینت REST درگاه پرداخت زیبال.

/// </summary>

public sealed class ZibalClient : IZibalClient

{

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)

    {

        PropertyNameCaseInsensitive = true,

        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull

    };



    private readonly HttpClient _httpClient;

    private readonly ZibalOptions _options;



    public ZibalClient(HttpClient httpClient, IOptions<ZibalOptions> options)

    {

        _httpClient = httpClient;

        _options = options.Value;

    }



    /// <inheritdoc />

    public async Task<ZibalPaymentRequestResult> RequestPaymentAsync(

        ZibalPaymentRequest request,

        CancellationToken cancellationToken = default)

    {

        EnsurePaymentEnabled();

        var merchant = ResolveMerchantOrThrow();



        var body = new

        {

            merchant,

            amount = request.Amount,

            callbackUrl = request.CallbackUrl,

            description = request.Description,

            orderId = request.OrderId,

            mobile = request.Mobile

        };



        var payload = await PostAsync<ZibalRequestResponse>("/v1/request", body, cancellationToken);

        if (payload.Result != ZibalResultCodes.Success || payload.TrackId is not > 0)

            throw new ZibalException(payload.Message ?? $"ایجاد تراکنش زیبال ناموفق بود. کد: {payload.Result}", payload.Result);



        return new ZibalPaymentRequestResult

        {

            Result = payload.Result,

            Message = payload.Message ?? "success",

            TrackId = payload.TrackId,

            PaymentUrl = BuildPaymentGatewayUrl(payload.TrackId)

        };

    }



    /// <inheritdoc />

    public async Task<ZibalPaymentVerifyResult> VerifyPaymentAsync(

        ZibalPaymentVerifyRequest request,

        CancellationToken cancellationToken = default)

    {

        EnsurePaymentEnabled();

        var merchant = ResolveMerchantOrThrow();



        var body = new

        {

            merchant,

            trackId = request.TrackId

        };



        var payload = await PostAsync<ZibalVerifyResponse>("/v1/verify", body, cancellationToken);

        var success = payload.Result is ZibalResultCodes.Success or ZibalResultCodes.AlreadyVerified;



        return new ZibalPaymentVerifyResult

        {

            IsSuccess = success,

            Result = payload.Result,

            Message = payload.Message ?? (success ? "success" : "Verification failed"),

            Amount = payload.Amount,

            Status = payload.Status,

            RefNumber = payload.RefNumber?.ToString(),

            CardNumber = payload.CardNumber,

            OrderId = payload.OrderId,

            PaidAt = payload.PaidAt

        };

    }



    /// <inheritdoc />

    public async Task<ZibalPaymentInquiryResult> InquiryPaymentAsync(

        ZibalPaymentInquiryRequest request,

        CancellationToken cancellationToken = default)

    {

        EnsurePaymentEnabled();

        var merchant = ResolveMerchantOrThrow();



        var body = new

        {

            merchant,

            trackId = request.TrackId

        };



        var payload = await PostAsync<ZibalInquiryResponse>("/v1/inquiry", body, cancellationToken);

        if (payload.Result != ZibalResultCodes.Success)

            throw new ZibalException(payload.Message ?? $"استعلام زیبال ناموفق بود. کد: {payload.Result}", payload.Result);



        return new ZibalPaymentInquiryResult

        {

            Result = payload.Result,

            Message = payload.Message ?? "success",

            Amount = payload.Amount,

            Status = payload.Status,

            RefNumber = payload.RefNumber?.ToString(),

            CardNumber = payload.CardNumber,

            OrderId = payload.OrderId,

            PaidAt = payload.PaidAt,

            VerifiedAt = payload.VerifiedAt

        };

    }



    /// <inheritdoc />

    public string BuildPaymentGatewayUrl(long trackId)

        => $"{_options.ResolveGatewayBaseUrl()}/start/{trackId}";



    private void EnsurePaymentEnabled()

    {

        if (!_options.Enabled)

            throw new ZibalException("درگاه پرداخت زیبال غیرفعال است.");

    }



    private string ResolveMerchantOrThrow()

    {

        var merchant = _options.ResolveMerchantId();

        if (string.IsNullOrWhiteSpace(merchant))

            throw new ZibalException("شناسه پذیرنده (merchant) زیبال تنظیم نشده است.");

        return merchant;

    }



    private async Task<T> PostAsync<T>(string path, object body, CancellationToken cancellationToken)

    {

        var url = $"{_options.ResolveGatewayBaseUrl()}{path}";

        using var response = await _httpClient.PostAsJsonAsync(url, body, JsonOptions, cancellationToken);

        var payload = await response.Content.ReadFromJsonAsync<T>(JsonOptions, cancellationToken);

        return payload ?? throw new ZibalException("پاسخ خالی از درگاه زیبال دریافت شد.");

    }



    private sealed class ZibalRequestResponse

    {

        public int Result { get; set; }

        public string? Message { get; set; }

        public long TrackId { get; set; }

    }



    private sealed class ZibalVerifyResponse

    {

        public int Result { get; set; }

        public string? Message { get; set; }

        public long Amount { get; set; }

        public int? Status { get; set; }

        public long? RefNumber { get; set; }

        public string? CardNumber { get; set; }

        public string? OrderId { get; set; }

        public string? PaidAt { get; set; }

    }



    private sealed class ZibalInquiryResponse

    {

        public int Result { get; set; }

        public string? Message { get; set; }

        public long Amount { get; set; }

        public int? Status { get; set; }

        public long? RefNumber { get; set; }

        public string? CardNumber { get; set; }

        public string? OrderId { get; set; }

        public string? PaidAt { get; set; }

        public string? VerifiedAt { get; set; }

    }

}


