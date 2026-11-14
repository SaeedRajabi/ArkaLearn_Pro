using ArkaSoftwarePro.Src.Core.RequestResponse.SecuritySettings.Commands.UpsertSecuritySettings;
using ArkaSoftwarePro.Src.Core.RequestResponse.SecuritySettings.Queries.GetSecuritySettings;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
public class SecuritySettingsController : BaseController
{
    [HttpGet("Get")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Get([FromQuery] GetSecuritySettingsQuery query)
        => await Query<GetSecuritySettingsQuery, SecuritySettingsQri>(query);

    [HttpPost("Upsert")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Upsert([FromBody] UpsertSecuritySettingsCommand command)
        => await Create<UpsertSecuritySettingsCommand, string>(command);
}
