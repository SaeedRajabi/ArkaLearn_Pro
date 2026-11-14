using ArkaSoftwarePro.Src.Core.RequestResponse.SiteAnnouncement.Commands.UpsertSiteAnnouncement;
using ArkaSoftwarePro.Src.Core.RequestResponse.SiteAnnouncement.Queries.GetSiteAnnouncement;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
public class SiteAnnouncementController : BaseController
{
    [HttpGet("Get")]
    public async Task<IActionResult> Get([FromQuery] GetSiteAnnouncementQuery query)
        => await Query<GetSiteAnnouncementQuery, SiteAnnouncementQri>(query);

    [HttpPost("Upsert")]
    [RequestSizeLimit(52_428_800)]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Upsert([FromForm] UpsertSiteAnnouncementCommand command)
        => await Create<UpsertSiteAnnouncementCommand, string>(command);
}
