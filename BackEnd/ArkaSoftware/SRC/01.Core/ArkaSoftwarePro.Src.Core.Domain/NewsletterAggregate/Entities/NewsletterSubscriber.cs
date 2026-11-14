using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.NewsletterAggregate.Entities;

/// <summary>Verified email subscriber for site newsletter / content publish alerts.</summary>
public class NewsletterSubscriber : AggregateRoot
{
    public string Email { get; private set; } = string.Empty;
    public bool IsVerified { get; private set; }
    public long? UserId { get; private set; }
    public DateTime? VerifiedAtUtc { get; private set; }
    public DateTime? UnsubscribedAtUtc { get; private set; }

    public bool IsActiveSubscriber => IsVerified && UnsubscribedAtUtc is null;

    private NewsletterSubscriber()
    {
    }

    public static NewsletterSubscriber CreatePending(string email)
    {
        var subscriber = new NewsletterSubscriber();
        subscriber.Email = NormalizeEmail(email);
        subscriber.IsVerified = false;
        return subscriber;
    }

    public static NewsletterSubscriber CreateVerified(string email, long? userId = null)
    {
        var subscriber = CreatePending(email);
        subscriber.MarkVerified(userId);
        return subscriber;
    }

    public void MarkVerified(long? userId = null)
    {
        IsVerified = true;
        VerifiedAtUtc = DateTime.UtcNow;
        UnsubscribedAtUtc = null;
        if (userId is > 0)
            UserId = userId;
    }

    public void LinkUser(long userId)
    {
        if (userId > 0)
            UserId = userId;
    }

    public void Unsubscribe()
    {
        UnsubscribedAtUtc = DateTime.UtcNow;
    }

    public static string NormalizeEmail(string? email)
        => (email ?? string.Empty).Trim().ToLowerInvariant();
}
