using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.CalendarEvents.Queries.GetCalendarEventById;

public class GetCalendarEventByIdQuery : IQuery<CalendarEventDetailQri>, IWebRequest
{
    public long EventId { get; set; }
    public string Path => "/api/Service/CalendarEvent/By-Id";
}

public class CalendarEventDetailQri
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int Category { get; set; }
    public string StartUtc { get; set; } = string.Empty;
    public string EndUtc { get; set; } = string.Empty;
    public bool IsAllDay { get; set; }
    public string? EventUrl { get; set; }
    public string? Description { get; set; }
    public long OwnerUserId { get; set; }
    public List<CalendarEventParticipantDetailQri> Participants { get; set; } = [];
}

public class CalendarEventParticipantDetailQri
{
    public long UserId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
}
