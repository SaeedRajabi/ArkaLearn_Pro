using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.CalendarAggregate.Entities;

public class CalendarEventParticipant : Entity
{
    public long CalendarEventId { get; private set; }
    public CalendarEvent? CalendarEvent { get; private set; }
    public long UserId { get; private set; }

    private CalendarEventParticipant() { }

    public static CalendarEventParticipant Create(long userId)
    {
        if (userId <= 0)
            throw new ArgumentException("User id must be positive.", nameof(userId));

        return new CalendarEventParticipant { UserId = userId };
    }
}
