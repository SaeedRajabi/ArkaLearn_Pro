using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.CalendarEvents.Commands.DeleteCalendarEvent;

public class DeleteCalendarEventCommand : ICommand<bool>, IWebRequest
{
    public long EventId { get; set; }
    public string Path => "/api/Service/CalendarEvent/Delete";
}
