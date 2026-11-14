using ArkaSoftwarePro.Src.Core.RequestResponse.NotificationSettings.Commands.UpsertNotificationSettings;
using ArkaSoftwarePro.Src.Core.RequestResponse.NotificationSettings.Queries.GetNotificationSettings;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
public class NotificationSettingsController : BaseController
{
    [HttpGet("Get")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Get([FromQuery] GetNotificationSettingsQuery query)
        => await Query<GetNotificationSettingsQuery, NotificationSettingsQri>(query);

    [HttpPost("Upsert")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Upsert([FromBody] UpsertNotificationSettingsCommand command)
        => await Create<UpsertNotificationSettingsCommand, string>(command);
}
