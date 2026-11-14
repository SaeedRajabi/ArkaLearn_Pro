namespace ArkaSoftwarePro.Src.Core.Domain.FinanceAggregate.Entities;

/// <summary>A server-owned snapshot of a gateway request and its one-time fulfillment.</summary>
public sealed class PaymentAttempt
{
    public string OrderId { get; private set; } = string.Empty;
    public string Provider { get; private set; } = string.Empty;
    public string? PaymentId { get; private set; }
    public long ExpectedAmount { get; private set; }
    public int AmountMultiplier { get; private set; }
    public int TargetType { get; private set; }
    public long TargetId { get; private set; }
    public long UserId { get; private set; }
    public DateTime CreatedUtc { get; private set; }
    public DateTime ExpiresUtc { get; private set; }
    public PaymentAttemptStatus Status { get; private set; }
    public Guid? LeaseId { get; private set; }
    public DateTime? LeaseExpiresUtc { get; private set; }
    public string? ReferenceNumber { get; private set; }
    public string? CardNumber { get; private set; }
    public string? ResultUrl { get; private set; }
    public DateTime? CompletedUtc { get; private set; }

    private PaymentAttempt() { }

    public PaymentAttempt(string orderId, string provider, long amount, int amountMultiplier,
        int targetType, long targetId, long userId)
    {
        if (string.IsNullOrWhiteSpace(orderId) || orderId.Length > 200 ||
            string.IsNullOrWhiteSpace(provider) || provider.Length > 32 ||
            amount <= 0 || amountMultiplier <= 0 || targetType <= 0 || targetId <= 0 || userId <= 0)
            throw new ArgumentException("Invalid payment request snapshot.");
        OrderId = orderId;
        Provider = provider;
        ExpectedAmount = amount;
        AmountMultiplier = amountMultiplier;
        TargetType = targetType;
        TargetId = targetId;
        UserId = userId;
        CreatedUtc = DateTime.UtcNow;
        ExpiresUtc = CreatedUtc.AddDays(1);
    }

    public bool Matches(string paymentId, string provider) =>
        !string.IsNullOrWhiteSpace(PaymentId) &&
        string.Equals(PaymentId, paymentId, StringComparison.Ordinal) &&
        string.Equals(Provider, provider, StringComparison.OrdinalIgnoreCase);

    public void Complete(string resultUrl)
    {
        if (Status != PaymentAttemptStatus.Processing || string.IsNullOrWhiteSpace(ReferenceNumber))
            throw new InvalidOperationException("Only a verified, acquired payment can be completed.");
        ResultUrl = resultUrl;
        CompletedUtc = DateTime.UtcNow;
        Status = PaymentAttemptStatus.Completed;
        LeaseId = null;
        LeaseExpiresUtc = null;
    }
}

public enum PaymentAttemptStatus { Created, Ready, Processing, Completed }
