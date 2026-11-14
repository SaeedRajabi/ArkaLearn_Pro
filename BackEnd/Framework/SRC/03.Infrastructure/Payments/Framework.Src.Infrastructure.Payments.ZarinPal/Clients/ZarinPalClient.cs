using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Framework.Src.Infrastructure.Payments.ZarinPal.Abstractions;
using Framework.Src.Infrastructure.Payments.ZarinPal.Exceptions;
using Framework.Src.Infrastructure.Payments.ZarinPal.Models.GraphQl;
using Framework.Src.Infrastructure.Payments.ZarinPal.Models.Payment;
using Framework.Src.Infrastructure.Payments.ZarinPal.Options;
using Microsoft.Extensions.Options;

namespace Framework.Src.Infrastructure.Payments.ZarinPal.Clients;

/// <summary>
/// پیاده‌سازی کامل کلاینت زرین‌پال (REST درگاه + GraphQL پنل).
/// </summary>
public sealed partial class ZarinPalClient : IZarinPalClient
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private readonly HttpClient _httpClient;
    private readonly ZarinPalOptions _options;

    /// <summary>
    /// سازنده کلاینت زرین‌پال.
    /// </summary>
    public ZarinPalClient(HttpClient httpClient, IOptions<ZarinPalOptions> options)
    {
        _httpClient = httpClient;
        _options = options.Value;
    }

    /// <inheritdoc />
    public async Task<ZarinPalPaymentRequestResult> RequestPaymentAsync(
        ZarinPalPaymentRequest request,
        CancellationToken cancellationToken = default)
    {
        EnsurePaymentEnabled();
        var merchantId = _options.ResolveMerchantId();
        if (string.IsNullOrWhiteSpace(merchantId))
            throw new ZarinPalException("شناسه پذیرنده (MerchantId) تنظیم نشده است.");

        var metadata = new Dictionary<string, string?>();
        if (!string.IsNullOrWhiteSpace(request.Mobile)) metadata["mobile"] = request.Mobile;
        if (!string.IsNullOrWhiteSpace(request.Email)) metadata["email"] = request.Email;
        if (!string.IsNullOrWhiteSpace(request.OrderId)) metadata["order_id"] = request.OrderId;

        var body = new
        {
            merchant_id = merchantId,
            amount = request.Amount,
            callback_url = request.CallbackUrl,
            description = request.Description,
            referrer_id = request.ReferrerId,
            metadata = metadata.Count > 0 ? metadata : null,
            card_pan = request.CardPan
        };

        var url = $"{_options.ResolveRestApiBaseUrl()}/payment/request.json";
        using var response = await _httpClient.PostAsJsonAsync(url, body, JsonOptions, cancellationToken);
        var payload = await response.Content.ReadFromJsonAsync<ZarinPalRestEnvelope<ZarinPalPaymentRequestData>>(JsonOptions, cancellationToken)
            ?? throw new ZarinPalException("پاسخ خالی از درگاه زرین‌پال دریافت شد.");

        if (payload.Errors is { Count: > 0 })
            throw new ZarinPalException(FormatErrors(payload.Errors));

        var data = payload.Data ?? throw new ZarinPalException("داده پرداخت در پاسخ زرین‌پال یافت نشد.");
        if (data.Code != 100 || string.IsNullOrWhiteSpace(data.Authority))
            throw new ZarinPalException(data.Message ?? $"ایجاد تراکنش ناموفق بود. کد: {data.Code}", data.Code);

        return new ZarinPalPaymentRequestResult
        {
            Code = data.Code,
            Message = data.Message ?? "Success",
            Authority = data.Authority,
            FeeType = data.FeeType,
            Fee = data.Fee,
            PaymentUrl = BuildPaymentGatewayUrl(data.Authority)
        };
    }

    /// <inheritdoc />
    public async Task<ZarinPalPaymentVerifyResult> VerifyPaymentAsync(
        ZarinPalPaymentVerifyRequest request,
        CancellationToken cancellationToken = default)
    {
        EnsurePaymentEnabled();
        var merchantId = _options.ResolveMerchantId();
        if (string.IsNullOrWhiteSpace(merchantId))
            throw new ZarinPalException("شناسه پذیرنده (MerchantId) تنظیم نشده است.");

        var body = new
        {
            merchant_id = merchantId,
            amount = request.Amount,
            authority = request.Authority
        };

        var url = $"{_options.ResolveRestApiBaseUrl()}/payment/verify.json";
        using var response = await _httpClient.PostAsJsonAsync(url, body, JsonOptions, cancellationToken);
        var payload = await response.Content.ReadFromJsonAsync<ZarinPalRestEnvelope<ZarinPalPaymentVerifyData>>(JsonOptions, cancellationToken)
            ?? throw new ZarinPalException("پاسخ خالی از درگاه زرین‌پال دریافت شد.");

        if (payload.Errors is { Count: > 0 })
        {
            var first = payload.Errors[0];
            return new ZarinPalPaymentVerifyResult
            {
                IsSuccess = false,
                Code = first.Code ?? -1,
                Message = first.Message ?? FormatErrors(payload.Errors)
            };
        }

        var data = payload.Data;
        if (data is null)
            return new ZarinPalPaymentVerifyResult { IsSuccess = false, Code = -1, Message = "داده تأیید در پاسخ یافت نشد." };

        var success = data.Code is 100 or 101;
        return new ZarinPalPaymentVerifyResult
        {
            IsSuccess = success,
            Code = data.Code,
            Message = data.Message ?? (success ? "Verified" : "Verification failed"),
            ReferenceId = data.RefId,
            CardPan = data.CardPan,
            CardHash = data.CardHash,
            FeeType = data.FeeType,
            Fee = data.Fee
        };
    }

    /// <inheritdoc />
    public string BuildPaymentGatewayUrl(string authority)
        => $"{_options.ResolvePaymentGatewayBaseUrl()}/{authority.Trim()}";

    private void EnsurePaymentEnabled()
    {
        if (!_options.Enabled)
            throw new ZarinPalException("درگاه پرداخت زرین‌پال غیرفعال است.");
    }

    private void EnsureGraphQlEnabled()
    {
        if (string.IsNullOrWhiteSpace(_options.AccessToken))
            throw new ZarinPalException("توکن دسترسی GraphQL (AccessToken) تنظیم نشده است.");
    }

    private async Task<JsonElement> ExecuteGraphQlAsync(
        string query,
        object? variables,
        CancellationToken cancellationToken)
    {
        EnsureGraphQlEnabled();

        using var request = new HttpRequestMessage(HttpMethod.Post, _options.GraphQlApiUrl.TrimEnd('/') + "/");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.AccessToken!.Trim());
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var body = JsonSerializer.Serialize(new { query, variables }, JsonOptions);
        request.Content = new StringContent(body, Encoding.UTF8, "application/json");

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        var raw = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
            throw new ZarinPalException($"خطای HTTP در GraphQL زرین‌پال: {(int)response.StatusCode} — {raw}");

        using var doc = JsonDocument.Parse(raw);
        var root = doc.RootElement;

        if (root.TryGetProperty("errors", out var errors) && errors.ValueKind == JsonValueKind.Array && errors.GetArrayLength() > 0)
        {
            var message = errors[0].TryGetProperty("message", out var msg) ? msg.GetString() : raw;
            throw new ZarinPalException(message ?? "خطای GraphQL زرین‌پال");
        }

        if (!root.TryGetProperty("data", out var data))
            throw new ZarinPalException("فیلد data در پاسخ GraphQL یافت نشد.");

        return data.Clone();
    }

    private static string FormatErrors(IReadOnlyList<ZarinPalRestError> errors)
        => string.Join(" | ", errors.Select(e => e.Message ?? $"کد {e.Code}"));

    private sealed class ZarinPalRestEnvelope<T>
    {
        public T? Data { get; set; }
        public List<ZarinPalRestError>? Errors { get; set; }
    }

    private sealed class ZarinPalRestError
    {
        public int? Code { get; set; }
        public string? Message { get; set; }
    }

    private sealed class ZarinPalPaymentRequestData
    {
        public int Code { get; set; }
        public string? Message { get; set; }
        public string? Authority { get; set; }
        public string? FeeType { get; set; }
        public long? Fee { get; set; }
    }

    private sealed class ZarinPalPaymentVerifyData
    {
        public int Code { get; set; }
        public string? Message { get; set; }
        public long? RefId { get; set; }
        public string? CardPan { get; set; }
        public string? CardHash { get; set; }
        public string? FeeType { get; set; }
        public long? Fee { get; set; }
    }
}
