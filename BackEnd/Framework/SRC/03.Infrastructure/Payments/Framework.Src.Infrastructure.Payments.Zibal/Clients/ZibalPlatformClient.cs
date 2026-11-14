using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Framework.Src.Infrastructure.Payments.Zibal.Abstractions;
using Framework.Src.Infrastructure.Payments.Zibal.Exceptions;
using Framework.Src.Infrastructure.Payments.Zibal.Models.Platform;
using Framework.Src.Infrastructure.Payments.Zibal.Options;
using Microsoft.Extensions.Options;

namespace Framework.Src.Infrastructure.Payments.Zibal.Clients;

/// <summary>
/// پیاده‌سازی REST API پلتفرم زیبال (کیف پول، گزارشات، ذی‌نفع، استرداد).
/// </summary>
public sealed class ZibalPlatformClient : IZibalPlatformClient
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private readonly HttpClient _httpClient;
    private readonly ZibalOptions _options;

    public ZibalPlatformClient(HttpClient httpClient, IOptions<ZibalOptions> options)
    {
        _httpClient = httpClient;
        _options = options.Value;
    }

    public Task<IReadOnlyList<ZibalWalletItem>> GetWalletListAsync(CancellationToken cancellationToken = default)
        => GetDataListAsync<ZibalWalletItem>("/v1/wallet/list", cancellationToken);

    public Task<IReadOnlyList<ZibalWalletItem>> GetWalletBalanceAsync(int walletId, CancellationToken cancellationToken = default)
        => PostDataListAsync<ZibalWalletItem>("/v1/wallet/balance", new { id = walletId }, cancellationToken);

    public Task<ZibalPagedResult<object>> GetCheckoutReportAsync(
        ZibalCheckoutReportRequest request,
        CancellationToken cancellationToken = default)
        => PostPagedAsync<object>("/v1/report/checkout", request, cancellationToken);

    public Task<ZibalPagedResult<object>> GetCheckoutQueueAsync(
        ZibalCheckoutQueueRequest request,
        CancellationToken cancellationToken = default)
        => PostPagedAsync<object>("/v1/report/checkout/queue", request, cancellationToken);

    public Task<object?> InquireCheckoutAsync(
        ZibalCheckoutInquireRequest request,
        CancellationToken cancellationToken = default)
        => PostDataObjectAsync("/v1/report/checkout/inquire", request, cancellationToken);

    public Task<ZibalPagedResult<object>> GetGatewayTransactionReportAsync(
        ZibalGatewayTransactionReportRequest request,
        CancellationToken cancellationToken = default)
        => PostPagedAsync<object>("/v1/gateway/report/transaction", request, cancellationToken);

    public async Task<ZibalSubMerchantItem> CreateSubMerchantAsync(
        ZibalSubMerchantCreateRequest request,
        CancellationToken cancellationToken = default)
    {
        var item = await PostDataObjectAsync<ZibalSubMerchantItem>("/v1/subMerchant/create", request, cancellationToken);
        return item ?? throw new ZibalException("پاسخ ایجاد ذی‌نفع زیبال خالی بود.");
    }

    public async Task<ZibalPagedResult<ZibalSubMerchantItem>> ListSubMerchantsAsync(
        int page,
        int size,
        ZibalSubMerchantFilter? filter = null,
        CancellationToken cancellationToken = default)
    {
        var body = new
        {
            page,
            size,
            subMerchant = filter == null
                ? null
                : new { id = filter.Id, bankAccount = filter.BankAccount }
        };
        return await PostPagedAsync<ZibalSubMerchantItem>("/v1/subMerchant/list", body, cancellationToken);
    }

    public async Task<ZibalSubMerchantItem> EditSubMerchantAsync(
        ZibalSubMerchantEditRequest request,
        CancellationToken cancellationToken = default)
    {
        var item = await PostDataObjectAsync<ZibalSubMerchantItem>("/v1/subMerchant/edit", request, cancellationToken);
        return item ?? throw new ZibalException("پاسخ ویرایش ذی‌نفع زیبال خالی بود.");
    }

    public async Task<ZibalRefundResult> RefundAsync(
        ZibalRefundRequest request,
        CancellationToken cancellationToken = default)
    {
        using var message = await SendAsync(HttpMethod.Post, "/v1/account/refund", request, cancellationToken);
        var envelope = await message.Content.ReadFromJsonAsync<ZibalRefundEnvelope>(JsonOptions, cancellationToken)
            ?? throw new ZibalException("پاسخ استرداد زیبال خالی بود.");

        EnsureSuccess(envelope.Result, envelope.Message);
        return new ZibalRefundResult
        {
            Status = envelope.Status,
            Result = envelope.Result,
            Message = envelope.Message ?? "موفق",
            Reversed = envelope.Data?.Reversed
        };
    }

    public Task<IReadOnlyList<object>> RefundInquiryAsync(
        ZibalRefundInquiryRequest request,
        CancellationToken cancellationToken = default)
        => PostDataListAsync<object>("/v1/account/refund/inquiry", request, cancellationToken);

    public Task<ZibalPagedResult<object>> RefundListAsync(
        ZibalRefundListRequest request,
        CancellationToken cancellationToken = default)
        => PostPagedAsync<object>("/v1/account/refund/list", request, cancellationToken);

    private async Task<IReadOnlyList<T>> GetDataListAsync<T>(string path, CancellationToken cancellationToken)
    {
        using var message = await SendAsync(HttpMethod.Get, path, null, cancellationToken);
        var envelope = await message.Content.ReadFromJsonAsync<ZibalPlatformEnvelope<List<T>>>(JsonOptions, cancellationToken)
            ?? throw new ZibalException("پاسخ زیبال خالی بود.");
        EnsureSuccess(envelope.Result, envelope.Message);
        return envelope.Data ?? [];
    }

    private async Task<IReadOnlyList<T>> PostDataListAsync<T>(string path, object body, CancellationToken cancellationToken)
    {
        using var message = await SendAsync(HttpMethod.Post, path, body, cancellationToken);
        var envelope = await message.Content.ReadFromJsonAsync<ZibalPlatformEnvelope<List<T>>>(JsonOptions, cancellationToken)
            ?? throw new ZibalException("پاسخ زیبال خالی بود.");
        EnsureSuccess(envelope.Result, envelope.Message);
        return envelope.Data ?? [];
    }

    private async Task<T?> PostDataObjectAsync<T>(string path, object body, CancellationToken cancellationToken)
    {
        using var message = await SendAsync(HttpMethod.Post, path, body, cancellationToken);
        var envelope = await message.Content.ReadFromJsonAsync<ZibalPlatformEnvelope<T>>(JsonOptions, cancellationToken)
            ?? throw new ZibalException("پاسخ زیبال خالی بود.");
        EnsureSuccess(envelope.Result, envelope.Message);
        return envelope.Data;
    }

    private async Task<object?> PostDataObjectAsync(string path, object body, CancellationToken cancellationToken)
    {
        using var message = await SendAsync(HttpMethod.Post, path, body, cancellationToken);
        var envelope = await message.Content.ReadFromJsonAsync<ZibalPlatformEnvelope<JsonElement>>(JsonOptions, cancellationToken)
            ?? throw new ZibalException("پاسخ زیبال خالی بود.");
        EnsureSuccess(envelope.Result, envelope.Message);
        return envelope.Data;
    }

    private async Task<ZibalPagedResult<T>> PostPagedAsync<T>(string path, object body, CancellationToken cancellationToken)
    {
        using var message = await SendAsync(HttpMethod.Post, path, body, cancellationToken);
        var envelope = await message.Content.ReadFromJsonAsync<ZibalPlatformEnvelope<List<T>>>(JsonOptions, cancellationToken)
            ?? throw new ZibalException("پاسخ زیبال خالی بود.");
        EnsureSuccess(envelope.Result, envelope.Message);
        return new ZibalPagedResult<T>
        {
            Items = envelope.Data ?? [],
            Total = envelope.Total ?? envelope.Data?.Count ?? 0,
            Sum = envelope.Sum,
            Message = envelope.Message ?? string.Empty,
            Result = envelope.Result
        };
    }

    private async Task<HttpResponseMessage> SendAsync(
        HttpMethod method,
        string path,
        object? body,
        CancellationToken cancellationToken)
    {
        var token = _options.ResolveAccessToken();
        if (string.IsNullOrWhiteSpace(token))
            throw new ZibalException("توکن دسترسی (AccessToken) API پلتفرم زیبال تنظیم نشده است.");

        var url = $"{_options.ResolvePlatformApiBaseUrl()}{path}";
        using var request = new HttpRequestMessage(method, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        if (body != null)
            request.Content = JsonContent.Create(body, options: JsonOptions);

        var response = await _httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var raw = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new ZibalException($"خطای HTTP زیبال: {(int)response.StatusCode} — {raw}");
        }

        return response;
    }

    private static void EnsureSuccess(int result, string? message)
    {
        if (result is not 1 and not 100)
            throw new ZibalException(message ?? $"درخواست زیبال ناموفق بود. result={result}", result);
    }

    private sealed class ZibalPlatformEnvelope<T>
    {
        public int Result { get; set; }
        public string? Message { get; set; }
        public T? Data { get; set; }
        public int? Total { get; set; }
        public long? Sum { get; set; }
    }

    private sealed class ZibalRefundEnvelope
    {
        public bool Status { get; set; }
        public int Result { get; set; }
        public string? Message { get; set; }
        public ZibalRefundData? Data { get; set; }
    }

    private sealed class ZibalRefundData
    {
        public bool? Reversed { get; set; }
    }
}
