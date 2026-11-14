using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.CalendarAggregate.Entities;

public class CalendarEventReminderDispatch : Entity
{
    public long CalendarEventId { get; private set; }
    public long UserId { get; private set; }
    public int MinutesBefore { get; private set; }
    public DateTime SentAtUtc { get; private set; }

    private CalendarEventReminderDispatch() { }

    public static CalendarEventReminderDispatch Create(
        long calendarEventId,
        long userId,
        int minutesBefore,
        DateTime sentAtUtc) =>
        new()
        {
            CalendarEventId = calendarEventId,
            UserId = userId,
            MinutesBefore = minutesBefore,
            SentAtUtc = sentAtUtc,
        };
}
