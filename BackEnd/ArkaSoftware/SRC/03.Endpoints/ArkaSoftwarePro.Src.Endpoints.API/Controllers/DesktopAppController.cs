using ArkaSoftwarePro.Src.Core.ApplicationService.DesktopAppServices;
using ArkaSoftwarePro.Src.Endpoints.API.Adapters.Uploads;
using ArkaSoftwarePro.Src.Core.Contracts.FileStorage;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopApp.Commands.DeleteDesktopAppRelease;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopApp.Commands.PublishDesktopAppRelease;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopApp.Commands.UnpublishDesktopAppRelease;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopApp.Queries.CheckDesktopAppUpdate;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopApp.Queries.GetDesktopAppReleases;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
public class DesktopAppController(
    IConfiguration configuration,
    DesktopInstallerDownloadService downloads) : BaseController
{

    /// <summary>
    /// Desktop startup version gate — anonymous so the app can check before login.
    /// InstallerUrl is rewritten to the named Download endpoint so browsers/clients
    /// save the package with a human-readable filename (not a media GUID).
    /// </summary>
    [HttpGet("CheckUpdate")]
    [AllowAnonymous]
    public async Task<IActionResult> CheckUpdate([FromQuery] string? currentVersion)
    {
        var result = await QueryDispatcher.Execute<CheckDesktopAppUpdateQuery, DesktopAppUpdateQri>(
            new CheckDesktopAppUpdateQuery { CurrentVersion = currentVersion });

        if (result.Status is ApplicationServiceStatus.InvalidDomainState or ApplicationServiceStatus.ValidationError)
            return BadRequest(result.Messages);

        if (result.Status == ApplicationServiceStatus.NotFound || result.Data is null)
            return StatusCode((int)HttpStatusCode.NoContent);

        if (result.Status != ApplicationServiceStatus.Ok)
            return BadRequest(result.Messages);

        var data = result.Data;
        if (!string.IsNullOrWhiteSpace(data.InstallerUrl) || !string.IsNullOrWhiteSpace(data.LatestVersion))
        {
            data.InstallerUrl = BuildPublicDownloadUrl(data.LatestVersion);
        }

        return Ok(data);
    }

    /// <summary>
    /// Public installer download with Content-Disposition filename
    /// (ArkaSoftwareDesktop-{version}.ext or the original published file name).
    /// </summary>
    [HttpGet("Download")]
    [AllowAnonymous]
    public async Task<IActionResult> Download([FromQuery] string? version, CancellationToken cancellationToken)
        => this.ToHttpResult(await downloads.Download(version, cancellationToken));

    [HttpGet("GetReleases")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetReleases([FromQuery] GetDesktopAppReleasesQuery query)
        => await Query<GetDesktopAppReleasesQuery, List<DesktopAppReleaseAdminQri>>(query);

    [HttpPost("PublishRelease")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> PublishRelease([FromBody] PublishDesktopAppReleaseCommand command)
        => await Create<PublishDesktopAppReleaseCommand, long>(command);

    [HttpPost("UnpublishRelease")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> UnpublishRelease([FromBody] UnpublishDesktopAppReleaseCommand command)
        => await Edit<UnpublishDesktopAppReleaseCommand, string>(command);

    [HttpPost("DeleteRelease")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> DeleteRelease([FromBody] DeleteDesktopAppReleaseCommand command)
        => await Delete<DeleteDesktopAppReleaseCommand, string>(command);

    private string BuildPublicDownloadUrl(string? version)
    {
        var publicBase =
            configuration["PaymentGateway:PublicApiBaseUrl"]
            ?? configuration["PublicApiBaseUrl"]
            ?? $"{Request.Scheme}://{Request.Host.Value}";

        publicBase = publicBase.TrimEnd('/');
        var url = $"{publicBase}/api/Service/DesktopApp/Download";
        if (!string.IsNullOrWhiteSpace(version))
            url += $"?version={Uri.EscapeDataString(version.Trim())}";
        return url;
    }

}
