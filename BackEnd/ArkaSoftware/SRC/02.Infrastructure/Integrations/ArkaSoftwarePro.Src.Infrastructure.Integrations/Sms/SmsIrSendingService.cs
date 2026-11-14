using ArkaSoftwarePro.Src.Core.Contracts.NotificationSettings;
using ArkaSoftwarePro.Src.Core.Contracts.Sms;
using ArkaSoftwarePro.Src.Core.Domain.NotificationSettingsAggregate.Entities;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.Sms;

public sealed class SmsIrSendingService(
    IHttpClientFactory httpClientFactory,
    INotificationSettingsProvider settingsProvider) : ISmsIrClient
{
    public async Task<SmsVerifySendResult> SendVerifyAsync(
        string mobile,
        int templateId,
        IReadOnlyList<SmsVerifyParameter> parameters,
        CancellationToken cancellationToken = default)
    {
        var settings = await RequireSettingsAsync(cancellationToken);
        var response = await SmsIrHttp.SendAsync<SmsIrVerifyData>(
            httpClientFactory,
            HttpMethod.Post,
            "https://api.sms.ir/v1/send/verify",
            settings.ApiKey,
            new
            {
                mobile = SmsIrHttp.NormalizeMobileForSmsIr(mobile),
                templateId,
                parameters = parameters
                    .Select(p => new { name = p.Name, value = SmsIrHttp.TruncateVerifyParameter(p.Value) })
                    .ToArray()
            },
            cancellationToken);
        return new SmsVerifySendResult { MessageId = response.MessageId, Cost = response.Cost };
    }

    public async Task<SmsBulkSendResult> SendBulkAsync(
        long lineNumber,
        string messageText,
        IReadOnlyList<string> mobiles,
        long? sendDateTimeUnix = null,
        CancellationToken cancellationToken = default)
    {
        var settings = await RequireSettingsAsync(cancellationToken);
        var response = await SmsIrHttp.SendAsync<SmsIrBulkData>(
            httpClientFactory,
            HttpMethod.Post,
            "https://api.sms.ir/v1/send/bulk",
            settings.ApiKey,
            new
            {
                lineNumber,
                messageText,
                mobiles = mobiles.Select(SmsIrHttp.NormalizeMobileForSmsIr).ToArray(),
                sendDateTime = sendDateTimeUnix
            },
            cancellationToken);
        return new SmsBulkSendResult
        {
            PackId = Guid.TryParse(response.PackId, out var packId) ? packId : Guid.Empty,
            MessageIds = response.MessageIds ?? Array.Empty<long>(),
            Cost = response.Cost
        };
    }

    public async Task<decimal?> GetCreditAsync(CancellationToken cancellationToken = default)
    {
        var settings = await settingsProvider.GetCurrentAsync(cancellationToken);
        if (settings is null || !settings.CanSendSms) return null;
        return await SmsIrHttp.SendAsync<decimal>(
            httpClientFactory,
            HttpMethod.Get,
            "https://api.sms.ir/v1/credit",
            settings.ApiKey,
            null,
            cancellationToken);
    }

    private async Task<NotificationSettings> RequireSettingsAsync(CancellationToken cancellationToken)
    {
        var settings = await settingsProvider.GetCurrentAsync(cancellationToken);
        if (settings is null || !settings.CanSendSms)
            throw new InvalidOperationException("SMS notifications are not configured.");
        return settings;
    }

    private sealed class SmsIrVerifyData
    {
        public long MessageId { get; set; }
        public decimal Cost { get; set; }
    }

    private sealed class SmsIrBulkData
    {
        public string? PackId { get; set; }
        public long[]? MessageIds { get; set; }
        public decimal Cost { get; set; }
    }
}
