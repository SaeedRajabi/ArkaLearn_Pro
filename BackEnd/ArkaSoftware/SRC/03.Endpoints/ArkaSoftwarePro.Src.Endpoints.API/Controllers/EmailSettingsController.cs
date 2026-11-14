using ArkaSoftwarePro.Src.Core.RequestResponse.EmailSettings.Commands.UpsertEmailSettings;
using ArkaSoftwarePro.Src.Core.RequestResponse.EmailSettings.Queries.GetEmailSettings;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
public class EmailSettingsController : BaseController
{
    [HttpGet("Get")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Get([FromQuery] GetEmailSettingsQuery query)
        => await Query<GetEmailSettingsQuery, EmailSettingsQri>(query);

    [HttpPost("Upsert")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Upsert([FromBody] UpsertEmailSettingsCommand command)
        => await Create<UpsertEmailSettingsCommand, string>(command);
}
