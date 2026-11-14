using ArkaSoftwarePro.Src.Core.RequestResponse.CalendarEvents.Commands.DeleteCalendarEvent;
using ArkaSoftwarePro.Src.Core.RequestResponse.CalendarEvents.Commands.SaveCalendarEvent;
using ArkaSoftwarePro.Src.Core.RequestResponse.CalendarEvents.Commands.UpdateCalendarEvent;
using ArkaSoftwarePro.Src.Core.RequestResponse.CalendarEvents.Queries.GetCalendarEventById;
using ArkaSoftwarePro.Src.Core.RequestResponse.CalendarEvents.Queries.GetCalendarEventsByRange;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
[ApiController]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
public class CalendarEventController : BaseController
{
    [HttpPost("Save")]
    public async Task<IActionResult> Save([FromBody] SaveCalendarEventCommand command)
        => await Create<SaveCalendarEventCommand, string>(command);

    [HttpPut("Update")]
    [HttpPost("Update")]
    public async Task<IActionResult> Update([FromBody] UpdateCalendarEventCommand command)
        => await Edit<UpdateCalendarEventCommand, bool>(command);

    [HttpDelete("Delete")]
    [HttpPost("Delete")]
    public async Task<IActionResult> Delete([FromQuery] long eventId)
        => await Edit<DeleteCalendarEventCommand, bool>(new DeleteCalendarEventCommand { EventId = eventId });

    [HttpGet("By-Range")]
    public async Task<IActionResult> GetByRange(
        [FromQuery] DateTime rangeStartUtc,
        [FromQuery] DateTime rangeEndUtc,
        [FromQuery] string? categories)
        => await Query<GetCalendarEventsByRangeQuery, List<CalendarEventQri>>(new GetCalendarEventsByRangeQuery
        {
            RangeStartUtc = rangeStartUtc,
            RangeEndUtc = rangeEndUtc,
            Categories = categories,
        });

    [HttpGet("By-Id")]
    public async Task<IActionResult> GetById([FromQuery] long eventId)
        => await Query<GetCalendarEventByIdQuery, CalendarEventDetailQri>(new GetCalendarEventByIdQuery
        {
            EventId = eventId,
        });
}
