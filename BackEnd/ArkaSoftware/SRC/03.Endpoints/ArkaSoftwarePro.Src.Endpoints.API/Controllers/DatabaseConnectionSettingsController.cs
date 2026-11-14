using ArkaSoftwarePro.Src.Core.RequestResponse.DatabaseConnectionSettings.Commands.UpsertDatabaseConnectionSettings;
using ArkaSoftwarePro.Src.Core.RequestResponse.DatabaseConnectionSettings.Queries.GetDatabaseConnectionSettings;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
public class DatabaseConnectionSettingsController : BaseController
{
    [HttpGet("Get")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Get([FromQuery] GetDatabaseConnectionSettingsQuery query)
        => await Query<GetDatabaseConnectionSettingsQuery, DatabaseConnectionSettingsQri>(query);

    [HttpPost("Upsert")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Upsert([FromBody] UpsertDatabaseConnectionSettingsCommand command)
        => await Create<UpsertDatabaseConnectionSettingsCommand, string>(command);
}
