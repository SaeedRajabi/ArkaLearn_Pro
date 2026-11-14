using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.CalendarEvents.Commands.UpdateCalendarEvent;

public class UpdateCalendarEventCommand : ICommand<bool>, IWebRequest
{
    public long EventId { get; set; }
    public string? Title { get; set; }
    public int Category { get; set; }
    public DateTime StartUtc { get; set; }
    public DateTime EndUtc { get; set; }
    public bool IsAllDay { get; set; }
    public string? EventUrl { get; set; }
    public string? Description { get; set; }
    public List<long> ParticipantUserIds { get; set; } = [];
    public string Path => "/api/Service/CalendarEvent/Update";
}
