using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.CalendarAggregate.Entities;

public class CalendarEventScheduledReminder : Entity
{
    public long CalendarEventId { get; private set; }
    public long UserId { get; private set; }
    public int MinutesBefore { get; private set; }
    public DateTime ScheduledAtUtc { get; private set; }
    public DateTime? SentAtUtc { get; private set; }
    public DateTime? CancelledAtUtc { get; private set; }

    private CalendarEventScheduledReminder() { }

    public bool IsPending => SentAtUtc == null && CancelledAtUtc == null;

    public static CalendarEventScheduledReminder Create(
        long calendarEventId,
        long userId,
        int minutesBefore,
        DateTime scheduledAtUtc) =>
        new()
        {
            CalendarEventId = calendarEventId,
            UserId = userId,
            MinutesBefore = minutesBefore,
            ScheduledAtUtc = scheduledAtUtc,
        };

    public void MarkSent() => SentAtUtc = DateTime.UtcNow;

    public void Cancel() => CancelledAtUtc = DateTime.UtcNow;
}
