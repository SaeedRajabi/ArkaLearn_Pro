using ArkaSoftwarePro.Src.Core.Domain.DashboardAggregate.Enumerations;
using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.DashboardAggregate.Entities;
/// <summary>Support ticket surfaced on the admin dashboard (stored for reporting and UX).</summary>
public class SupportTicket : AggregateRoot
{
    private const int MaxSubjectLength = 300;
    private const int MaxRequesterNameLength = 200;
    private const int MaxDepartmentLength = 50;
    private const int MaxPreviewLength = 200;
    private const int MaxRatingCommentLength = 1000;

    public int DisplayNumber { get; private set; }
    public string TicketSource { get; private set; } = SupportTicketSource.Contact;
    public string Subject { get; private set; } = string.Empty;
    public string Message { get; private set; } = string.Empty;
    public string Status { get; private set; } = "Open";
    public string Department { get; private set; } = string.Empty;
    public string RequesterName { get; private set; } = string.Empty;
    public string RequesterEmail { get; private set; } = string.Empty;
    public string? RequesterAvatarUrl { get; private set; }
    public long? RequesterUserId { get; private set; }
    public string? AdminReply { get; private set; }
    public DateTime? RepliedAt { get; private set; }
    public long? RepliedByUserId { get; private set; }
    public DateTime? FirstViewedAtUtc { get; private set; }
    public long? FirstViewedByUserId { get; private set; }
    public DateTime? ClosedAtUtc { get; private set; }
    public int? Rating { get; private set; }
    public string? RatingComment { get; private set; }
    public DateTime? LastMessageAtUtc { get; private set; }
    public string? LastMessagePreview { get; private set; }

    public IReadOnlyList<SupportTicketMessage> Messages => _messages;
    private readonly List<SupportTicketMessage> _messages = new();

    private SupportTicket() { }

    public static SupportTicket Create(
        int displayNumber,
        string subject,
        string message,
        string requesterName,
        string requesterEmail,
        string? requesterAvatarUrl,
        string status = "Open")
    {
        return new SupportTicket
        {
            DisplayNumber = displayNumber,
            TicketSource = SupportTicketSource.Contact,
            Subject = subject ?? string.Empty,
            Message = message ?? string.Empty,
            Status = string.IsNullOrWhiteSpace(status) ? "Open" : status.Trim(),
            RequesterName = Truncate(requesterName ?? string.Empty, MaxRequesterNameLength),
            RequesterEmail = (requesterEmail ?? string.Empty).Trim().ToLowerInvariant(),
            RequesterAvatarUrl = requesterAvatarUrl,
        };
    }

    public static SupportTicket CreateContactRequest(
        int displayNumber,
        string requesterName,
        string requesterEmail,
        string message)
    {
        var trimmedMessage = (message ?? string.Empty).Trim();
        var subject = BuildSubject(requesterName, trimmedMessage);
        return Create(displayNumber, subject, trimmedMessage, requesterName, requesterEmail, null, "Open");
    }

    public static SupportTicket CreateIpUnblockRequest(
        int displayNumber,
        long requesterUserId,
        string requesterName,
        string requesterEmail,
        string blockedIp,
        string message)
    {
        var trimmedMessage = (message ?? string.Empty).Trim();
        var ip = (blockedIp ?? string.Empty).Trim();
        var subject = Truncate($"IP unblock request — {ip}", MaxSubjectLength);
        var body = string.IsNullOrWhiteSpace(trimmedMessage)
            ? $"Blocked IP: {ip}"
            : $"Blocked IP: {ip}\n\n{trimmedMessage}";

        return new SupportTicket
        {
            DisplayNumber = displayNumber,
            TicketSource = SupportTicketSource.IpUnblock,
            Subject = subject,
            Message = Truncate(body, MaxPreviewLength),
            Status = "Open",
            Department = "Support",
            RequesterName = Truncate(requesterName ?? string.Empty, MaxRequesterNameLength),
            RequesterEmail = (requesterEmail ?? string.Empty).Trim().ToLowerInvariant(),
            RequesterUserId = requesterUserId,
        };
    }

    public static SupportTicket CreatePlatform(
        int displayNumber,
        long requesterUserId,
        string subject,
        string initialContentHtml,
        string department,
        string requesterName,
        string requesterEmail,
        string? requesterAvatarUrl)
    {
        var ticket = new SupportTicket
        {
            DisplayNumber = displayNumber,
            TicketSource = SupportTicketSource.Platform,
            Subject = Truncate((subject ?? string.Empty).Trim(), MaxSubjectLength),
            Message = SupportTicketFormatting.StripHtml(initialContentHtml, MaxPreviewLength),
            Status = PlatformSupportTicketStatus.UnderReview,
            Department = Truncate((department ?? string.Empty).Trim(), MaxDepartmentLength),
            RequesterName = Truncate(requesterName ?? string.Empty, MaxRequesterNameLength),
            RequesterEmail = (requesterEmail ?? string.Empty).Trim().ToLowerInvariant(),
            RequesterAvatarUrl = requesterAvatarUrl,
            RequesterUserId = requesterUserId,
        };

        var message = ticket.AddUserMessage(requesterUserId, initialContentHtml);
        ticket.UpdateLastMessagePreview(message);
        return ticket;
    }

    public bool IsPlatformTicket() => TicketSource == SupportTicketSource.Platform;

    public bool IsOwnedBy(long userId) => RequesterUserId == userId;

    public SupportTicketMessage AddUserMessage(long senderUserId, string contentHtml, long? replyToMessageId = null)
    {
        EnsurePlatformOpen(senderUserId, isStaff: false);
        var message = SupportTicketMessage.Create(senderUserId, contentHtml, replyToMessageId);
        _messages.Add(message);
        LastMessageAtUtc = message.SentAtUtc;
        return message;
    }

    public SupportTicketMessage AddStaffMessage(long staffUserId, string contentHtml, long? replyToMessageId = null)
    {
        EnsurePlatformOpen(staffUserId, isStaff: true);
        var message = SupportTicketMessage.CreateStaff(staffUserId, contentHtml, replyToMessageId);
        _messages.Add(message);
        LastMessageAtUtc = message.SentAtUtc;
        if (Status is PlatformSupportTicketStatus.UnderReview or PlatformSupportTicketStatus.ViewedByAdmin)
            Status = PlatformSupportTicketStatus.Answered;
        return message;
    }

    public void UpdateLastMessagePreview(SupportTicketMessage message)
    {
        LastMessagePreview = SupportTicketFormatting.StripHtml(message.ContentHtml, MaxPreviewLength);
        LastMessageAtUtc = message.SentAtUtc;
    }

    public bool MarkFirstViewed(long adminUserId)
    {
        var isFirstView = !FirstViewedAtUtc.HasValue;
        if (isFirstView)
        {
            FirstViewedAtUtc = DateTime.UtcNow;
            FirstViewedByUserId = adminUserId;
        }

        if (Status == PlatformSupportTicketStatus.UnderReview)
            Status = PlatformSupportTicketStatus.ViewedByAdmin;

        return isFirstView;
    }

    public void CloseWithRating(int? rating, string? ratingComment)
    {
        if (!IsPlatformTicket())
            return;

        if (Status != PlatformSupportTicketStatus.Answered)
            throw new InvalidOperationException("Only answered tickets can be closed.");

        if (rating is < 1 or > 5)
            rating = null;

        Rating = rating;
        RatingComment = string.IsNullOrWhiteSpace(ratingComment)
            ? null
            : Truncate(ratingComment.Trim(), MaxRatingCommentLength);
        ClosedAtUtc = DateTime.UtcNow;
        Status = PlatformSupportTicketStatus.Closed;
    }

    public void ChangeStatus(string newStatus)
    {
        if (!string.IsNullOrWhiteSpace(newStatus))
            Status = newStatus.Trim();
    }

    public void Reply(string reply, long adminUserId)
    {
        AdminReply = (reply ?? string.Empty).Trim();
        RepliedAt = DateTime.UtcNow;
        RepliedByUserId = adminUserId;
        Status = "Replied";
    }

    private void EnsurePlatformOpen(long actorUserId, bool isStaff)
    {
        if (!IsPlatformTicket())
            throw new InvalidOperationException("Only platform tickets support threaded messages.");

        if (Status == PlatformSupportTicketStatus.Closed)
            throw new InvalidOperationException("This ticket is closed.");

        if (!isStaff && !IsOwnedBy(actorUserId))
            throw new InvalidOperationException("You are not allowed to post on this ticket.");
    }

    private static string BuildSubject(string requesterName, string message)
    {
        var preview = message.Length > 80 ? message[..80] + "..." : message;
        var name = string.IsNullOrWhiteSpace(requesterName)
            ? "Visitor"
            : Truncate(requesterName.Trim(), MaxRequesterNameLength);
        var subject = string.IsNullOrWhiteSpace(preview)
            ? $"Contact request from {name}"
            : $"Contact request from {name}: {preview}";
        return Truncate(subject, MaxSubjectLength);
    }

    private static string Truncate(string value, int maxLength)
        => value.Length <= maxLength ? value : value[..maxLength];
}
