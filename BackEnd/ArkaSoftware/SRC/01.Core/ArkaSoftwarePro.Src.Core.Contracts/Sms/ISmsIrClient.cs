namespace ArkaSoftwarePro.Src.Core.Contracts.Sms;

public sealed class SmsVerifyParameter
{
    public const int MaxValueLength = 25;
    public string Name { get; init; } = string.Empty;
    public string Value { get; init; } = string.Empty;
}

public sealed class SmsVerifySendResult
{
    public long MessageId { get; init; }
    public decimal Cost { get; init; }
}

public sealed class SmsBulkSendResult
{
    public Guid PackId { get; init; }
    public IReadOnlyList<long> MessageIds { get; init; } = Array.Empty<long>();
    public decimal Cost { get; init; }
}

public interface ISmsIrClient
{
    Task<SmsVerifySendResult> SendVerifyAsync(string mobile, int templateId, IReadOnlyList<SmsVerifyParameter> parameters, CancellationToken cancellationToken = default);
    Task<SmsBulkSendResult> SendBulkAsync(long lineNumber, string messageText, IReadOnlyList<string> mobiles, long? sendDateTimeUnix = null, CancellationToken cancellationToken = default);
    Task<decimal?> GetCreditAsync(CancellationToken cancellationToken = default);
}
