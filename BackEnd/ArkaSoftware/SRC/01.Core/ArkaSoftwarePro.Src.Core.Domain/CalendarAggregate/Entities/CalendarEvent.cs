using ArkaSoftwarePro.Src.Core.Domain.CalendarAggregate.Enumerations;
using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.CalendarAggregate.Entities;

public class CalendarEvent : AggregateRoot
{
    public string Title { get; private set; } = string.Empty;
    public CalendarEventCategory Category { get; private set; }
    public DateTime StartUtc { get; private set; }
    public DateTime EndUtc { get; private set; }
    public bool IsAllDay { get; private set; }
    public string? EventUrl { get; private set; }
    public string? Description { get; private set; }
    public long OwnerUserId { get; private set; }

    private readonly List<CalendarEventParticipant> _participants = [];
    public IReadOnlyCollection<CalendarEventParticipant> Participants => _participants.AsReadOnly();

    private CalendarEvent() { }

    public static CalendarEvent Create(
        string title,
        CalendarEventCategory category,
        DateTime startUtc,
        DateTime endUtc,
        bool isAllDay,
        string? eventUrl,
        string? description,
        long ownerUserId,
        IEnumerable<long> participantUserIds)
    {
        ValidateSchedule(startUtc, endUtc, isAllDay);

        var calendarEvent = new CalendarEvent
        {
            Title = title.Trim(),
            Category = category,
            StartUtc = startUtc,
            EndUtc = endUtc,
            IsAllDay = isAllDay,
            EventUrl = NormalizeUrl(eventUrl),
            Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim(),
            OwnerUserId = ownerUserId,
        };

        calendarEvent.ReplaceParticipants(participantUserIds);
        return calendarEvent;
    }

    public void Update(
        string title,
        CalendarEventCategory category,
        DateTime startUtc,
        DateTime endUtc,
        bool isAllDay,
        string? eventUrl,
        string? description,
        IEnumerable<long> participantUserIds)
    {
        ValidateSchedule(startUtc, endUtc, isAllDay);

        Title = title.Trim();
        Category = category;
        StartUtc = startUtc;
        EndUtc = endUtc;
        IsAllDay = isAllDay;
        EventUrl = NormalizeUrl(eventUrl);
        Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        ReplaceParticipants(participantUserIds);
    }

    public void Remove()
    {
        if (IsDelete)
            return;

        IsDelete = true;
    }

    public IReadOnlyList<long> ReplaceParticipants(IEnumerable<long> participantUserIds)
    {
        var normalized = participantUserIds
            .Where(x => x > 0)
            .Distinct()
            .ToList();

        _participants.Clear();
        foreach (var userId in normalized)
            _participants.Add(CalendarEventParticipant.Create(userId));

        return normalized;
    }

    private static void ValidateSchedule(DateTime startUtc, DateTime endUtc, bool isAllDay)
    {
        if (endUtc < startUtc)
            throw new ArgumentException("End must be after start.");
        if (!isAllDay && (endUtc - startUtc).TotalMinutes < 1)
            throw new ArgumentException("Timed events must be at least one minute long.");
    }

    private static string? NormalizeUrl(string? eventUrl)
    {
        if (string.IsNullOrWhiteSpace(eventUrl))
            return null;

        var trimmed = eventUrl.Trim();
        return trimmed.Length > 500 ? trimmed[..500] : trimmed;
    }
}
