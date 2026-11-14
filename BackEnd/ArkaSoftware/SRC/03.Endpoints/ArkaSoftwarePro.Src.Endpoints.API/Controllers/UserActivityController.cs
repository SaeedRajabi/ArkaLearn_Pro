using ArkaSoftwarePro.Src.Core.RequestResponse.UserActivity.Commands.TrackUserActivity;
using ArkaSoftwarePro.Src.Core.RequestResponse.UserActivity.Queries.GetUserActivityTimeline;
using ArkaSoftwarePro.Src.Core.RequestResponse.UserActivity.Queries.SearchUserActivitySubjects;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
public class UserActivityController : BaseController
{
    [HttpPost("Track")]
    [AllowAnonymous]
    public Task<IActionResult> Track([FromBody] TrackUserActivityCommand command)
        => Create<TrackUserActivityCommand, string>(command);

    [HttpGet("SearchSubjects")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public Task<IActionResult> SearchSubjects([FromQuery] SearchUserActivitySubjectsQuery query)
        => Query<SearchUserActivitySubjectsQuery, PagedData<UserActivitySubjectListItemQri>>(query);

    [HttpGet("GetTimeline")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public Task<IActionResult> GetTimeline([FromQuery] GetUserActivityTimelineQuery query)
        => Query<GetUserActivityTimelineQuery, UserActivityTimelineQri>(query);
}
