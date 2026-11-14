using ArkaSoftwarePro.Src.Core.RequestResponse.MediaUploadSettings.Commands.UpsertMediaUploadSettings;
using ArkaSoftwarePro.Src.Core.RequestResponse.MediaUploadSettings.Queries.GetMediaUploadSettings;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
public class MediaUploadSettingsController : BaseController
{
    [HttpGet("Get")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Get([FromQuery] GetMediaUploadSettingsQuery query)
        => await Query<GetMediaUploadSettingsQuery, MediaUploadSettingsQri>(query);

    [HttpPost("Upsert")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Upsert([FromBody] UpsertMediaUploadSettingsCommand command)
        => await Create<UpsertMediaUploadSettingsCommand, string>(command);
}
