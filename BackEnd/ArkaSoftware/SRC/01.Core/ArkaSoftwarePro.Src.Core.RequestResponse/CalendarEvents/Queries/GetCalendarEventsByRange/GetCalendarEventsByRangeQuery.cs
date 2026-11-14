using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.CalendarEvents.Queries.GetCalendarEventsByRange;

public class GetCalendarEventsByRangeQuery : IQuery<List<CalendarEventQri>>, IWebRequest
{
    public DateTime RangeStartUtc { get; set; }
    public DateTime RangeEndUtc { get; set; }
    public string? Categories { get; set; }
    public string Path => "/api/Service/CalendarEvent/By-Range";
}

public class CalendarEventQri
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
    public List<CalendarEventParticipantQri> Participants { get; set; } = [];
}

public class CalendarEventParticipantQri
{
    public long UserId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
}
