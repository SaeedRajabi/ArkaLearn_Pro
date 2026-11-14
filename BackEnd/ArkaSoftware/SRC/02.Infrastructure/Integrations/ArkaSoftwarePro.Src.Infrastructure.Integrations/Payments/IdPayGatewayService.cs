using ArkaSoftwarePro.Src.Core.Contracts.Finance.Payments;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Options;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.Payments
{
    public class IdPayGatewayService(
        HttpClient httpClient,
        IOptions<PaymentGatewayOptions> options)
        : IClientPaymentGateway
    {
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
        {
            PropertyNameCaseInsensitive = true
        };

        private readonly HttpClient _httpClient = httpClient;
        private readonly PaymentGatewayOptions _options = options.Value;

        public async Task<PaymentStartResult> CreatePaymentAsync(PaymentStartRequest request, CancellationToken cancellationToken = default)
        {
            EnsureConfigured();

            var response = await _httpClient.PostAsJsonAsync(
                $"{NormalizeApiBaseUrl()}/payment",
                new
                {
                    order_id = request.OrderId,
                    amount = request.Amount,
                    name = request.Name,
                    phone = request.PhoneNumber,
                    mail = request.Email,
                    desc = request.Description,
                    callback = request.CallbackUrl
                },
                JsonOptions,
                cancellationToken);

            using var payload = await ReadPayloadAsync(response, cancellationToken);
            if (!response.IsSuccessStatusCode)
                throw new InvalidOperationException(ReadErrorMessage(payload.RootElement, response.ReasonPhrase));

            var paymentId = FindString(payload.RootElement, "id");
            var paymentUrl = FindString(payload.RootElement, "link");

            if (string.IsNullOrWhiteSpace(paymentId) || string.IsNullOrWhiteSpace(paymentUrl))
                throw new InvalidOperationException("The payment gateway response did not include a valid payment link.");

            return new PaymentStartResult(paymentId, paymentUrl);
        }

        public async Task<PaymentVerifyResult> VerifyPaymentAsync(PaymentVerifyRequest request, CancellationToken cancellationToken = default)
        {
            EnsureConfigured();

            var response = await _httpClient.PostAsJsonAsync(
                $"{NormalizeApiBaseUrl()}/payment/verify",
                new
                {
                    id = request.PaymentId,
                    order_id = request.OrderId
                },
                JsonOptions,
                cancellationToken);

            using var payload = await ReadPayloadAsync(response, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                return new PaymentVerifyResult(
                    false,
                    ReadErrorMessage(payload.RootElement, response.ReasonPhrase),
                    0,
                    null,
                    null,
                    request.PaymentId);
            }

            var statusValue = FindLong(payload.RootElement, "status");
            var amount = FindLong(payload.RootElement, "amount");
            var referenceNumber = FindString(payload.RootElement, "track_id");
            var cardNumber = FindString(payload.RootElement, "card_no");
            var paymentId = FindString(payload.RootElement, "id") ?? request.PaymentId;

            var isSuccess = statusValue is 100 or 101 && amount > 0 && !string.IsNullOrWhiteSpace(referenceNumber);
            var message = isSuccess
                ? "Payment verified successfully."
                : ReadErrorMessage(payload.RootElement, "The payment gateway did not confirm the transaction.");

            return new PaymentVerifyResult(
                isSuccess,
                message,
                amount ?? 0,
                referenceNumber,
                cardNumber,
                paymentId,
                FindString(payload.RootElement, "order_id"));
        }

        private async Task<JsonDocument> ReadPayloadAsync(HttpResponseMessage response, CancellationToken cancellationToken)
        {
            var raw = await response.Content.ReadAsStringAsync(cancellationToken);
            if (string.IsNullOrWhiteSpace(raw))
                return JsonDocument.Parse("{}");

            return JsonDocument.Parse(raw);
        }

        private void EnsureConfigured()
        {
            if (!_options.Enabled)
                throw new InvalidOperationException("The payment gateway is disabled.");

            if (!string.Equals(_options.Provider, "IdPay", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException($"The configured payment provider '{_options.Provider}' is not supported by this adapter.");

            if (string.IsNullOrWhiteSpace(_options.ApiKey))
                throw new InvalidOperationException("The payment gateway API key is not configured.");
        }

        private string NormalizeApiBaseUrl() => _options.ApiBaseUrl.Trim().TrimEnd('/');

        private static string ReadErrorMessage(JsonElement root, string? fallback)
        {
            return FindString(root, "error_message")
                ?? FindString(root, "message")
                ?? FindString(root, "error")
                ?? fallback
                ?? "The payment gateway request failed.";
        }

        private static string? FindString(JsonElement element, string propertyName)
        {
            if (element.ValueKind == JsonValueKind.Object)
            {
                foreach (var property in element.EnumerateObject())
                {
                    if (property.NameEquals(propertyName))
                        return property.Value.ValueKind == JsonValueKind.String ? property.Value.GetString() : property.Value.ToString();

                    var nested = FindString(property.Value, propertyName);
                    if (!string.IsNullOrWhiteSpace(nested))
                        return nested;
                }
            }

            if (element.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in element.EnumerateArray())
                {
                    var nested = FindString(item, propertyName);
                    if (!string.IsNullOrWhiteSpace(nested))
                        return nested;
                }
            }

            return null;
        }

        private static long? FindLong(JsonElement element, string propertyName)
        {
            var raw = FindString(element, propertyName);
            return long.TryParse(raw, out var parsed) ? parsed : null;
        }
    }
}
