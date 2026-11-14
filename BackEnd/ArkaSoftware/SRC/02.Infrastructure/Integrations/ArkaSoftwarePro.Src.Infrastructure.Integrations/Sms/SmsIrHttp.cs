using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.Sms;

internal static class SmsIrHttp
{
    /// <summary>SMS.ir verify templates reject parameter values longer than 25 characters.</summary>
    public const int MaxVerifyParameterLength = ArkaSoftwarePro.Src.Core.Contracts.Sms.SmsVerifyParameter.MaxValueLength;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public static async Task<TData> SendAsync<TData>(
        IHttpClientFactory httpClientFactory,
        HttpMethod method,
        string url,
        string apiKey,
        object? payload,
        CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(method, url);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        if (!string.IsNullOrWhiteSpace(apiKey))
            request.Headers.Add("X-API-KEY", apiKey);
        if (payload is not null)
            request.Content = new StringContent(JsonSerializer.Serialize(payload, JsonOptions), Encoding.UTF8, "application/json");

        var client = httpClientFactory.CreateClient(nameof(SmsIrSendingService));
        HttpResponseMessage response;
        string body;
        try
        {
            response = await client.SendAsync(request, cancellationToken);
            body = await response.Content.ReadAsStringAsync(cancellationToken);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            throw new InvalidOperationException("SMS provider did not respond in time. Please try again.");
        }
        catch (HttpRequestException ex)
        {
            throw new InvalidOperationException("Could not reach the SMS provider. Please try again later.", ex);
        }

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(
                string.IsNullOrWhiteSpace(body)
                    ? $"SMS provider returned HTTP {(int)response.StatusCode}."
                    : TryExtractProviderMessage(body) ?? $"SMS provider returned HTTP {(int)response.StatusCode}.");
        }

        SmsIrEnvelope<TData>? envelope;
        try
        {
            envelope = JsonSerializer.Deserialize<SmsIrEnvelope<TData>>(body, JsonOptions);
        }
        catch (JsonException)
        {
            throw new InvalidOperationException("SMS provider returned an invalid response.");
        }

        if (envelope is null)
            throw new InvalidOperationException("SMS provider returned an empty response.");
        if (envelope.Status != 1)
            throw new InvalidOperationException(MapSmsIrStatus(envelope.Status, envelope.Message));
        if (envelope.Data is null)
            throw new InvalidOperationException("SMS provider returned no data.");
        return envelope.Data;
    }

    public static string TruncateVerifyParameter(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return value?.Trim() ?? string.Empty;
        var trimmed = value.Trim();
        return trimmed.Length <= MaxVerifyParameterLength
            ? trimmed
            : trimmed[..MaxVerifyParameterLength].Trim();
    }

    public static string NormalizeMobileForSmsIr(string input)
    {
        var digits = new string(input.Where(char.IsDigit).ToArray());
        if (digits.StartsWith("0098", StringComparison.Ordinal))
            digits = digits[4..];
        else if (digits.StartsWith("98", StringComparison.Ordinal) && digits.Length >= 12)
            digits = digits[2..];
        if (digits.StartsWith('0'))
            digits = digits[1..];
        return digits;
    }

    private static string? TryExtractProviderMessage(string body)
    {
        try
        {
            var envelope = JsonSerializer.Deserialize<SmsIrEnvelope<JsonElement>>(body, JsonOptions);
            return envelope?.Message;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static string MapSmsIrStatus(int status, string? message)
    {
        var mapped = status switch
        {
            0 => "SMS request failed.",
            10 => "SMS API key is invalid.",
            11 => "SMS API key is disabled.",
            12 => "SMS API key is restricted to specific IP addresses.",
            13 => "SMS account is inactive.",
            14 => "SMS account is suspended.",
            15 => "Upgrade your SMS plan to use the web service.",
            16 => "Invalid SMS parameter value.",
            20 => "Too many SMS requests. Please wait and try again.",
            101 => "Invalid SMS line number.",
            102 => "Insufficient SMS credit.",
            103 => "SMS text is empty.",
            104 => "Invalid mobile number.",
            105 => "Too many mobile numbers in one request.",
            113 => "SMS verification template was not found.",
            114 => "SMS parameter value is too long (max 25 characters per verify template parameter).",
            115 => "Mobile number is blocked for SMS.",
            116 => "SMS template parameter names do not match the configured template.",
            117 => "SMS text is not approved.",
            123 => "SMS sender line needs to be activated.",
            124 => "OTP template is not recognized by the SMS provider.",
            _ => null
        };

        if (!string.IsNullOrWhiteSpace(mapped))
            return mapped;
        return string.IsNullOrWhiteSpace(message) ? "SMS send failed." : message.Trim();
    }

    private sealed class SmsIrEnvelope<T>
    {
        public int Status { get; set; }
        public string? Message { get; set; }
        public T? Data { get; set; }
    }
}
