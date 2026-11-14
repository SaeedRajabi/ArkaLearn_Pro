using ArkaSoftwarePro.Src.Core.RequestResponse.GoogleAuthSettings.Commands.UpsertGoogleAuthSettings;
using ArkaSoftwarePro.Src.Core.RequestResponse.GoogleAuthSettings.Queries.GetGoogleAuthSettings;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
public class GoogleAuthSettingsController : BaseController
{
    [HttpGet("Get")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Get([FromQuery] GetGoogleAuthSettingsQuery query)
        => await Query<GetGoogleAuthSettingsQuery, GoogleAuthSettingsQri>(query);

    [HttpPost("Upsert")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Upsert([FromBody] UpsertGoogleAuthSettingsCommand command)
        => await Create<UpsertGoogleAuthSettingsCommand, string>(command);
}
