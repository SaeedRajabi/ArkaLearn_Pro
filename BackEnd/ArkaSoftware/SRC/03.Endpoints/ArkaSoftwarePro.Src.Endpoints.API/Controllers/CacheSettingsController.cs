using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.Contracts.Caching;
using ArkaSoftwarePro.Src.Core.RequestResponse.CacheSettings.Commands.UpsertCacheSettings;
using ArkaSoftwarePro.Src.Core.RequestResponse.CacheSettings.Queries.GetCacheSettings;
using ArkaSoftwarePro.Src.Endpoints.API.Common;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
public class CacheSettingsController(ICacheWarmupService cacheWarmupService) : BaseController
{
    [HttpGet("Get")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Get([FromQuery] GetCacheSettingsQuery query)
        => await Query<GetCacheSettingsQuery, CacheSettingsQri>(query);

    [HttpPost("Upsert")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Upsert([FromBody] UpsertCacheSettingsCommand command)
        => await Create<UpsertCacheSettingsCommand, CacheSettingsQri>(command);

    /// <summary>Rebuild/warm application cache (admin). Flat route for proxy compatibility.</summary>
    [HttpPost("StartWarmup")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> StartWarmup(CancellationToken cancellationToken)
    {
        if (!User.IsDashboardAdminRole())
            return Forbid();

        try
        {
            var progress = await cacheWarmupService.StartAsync(cancellationToken);
            return Ok(progress);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("WarmupStatus")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public IActionResult WarmupStatus([FromQuery] string? jobId = null)
    {
        if (!User.IsDashboardAdminRole())
            return Forbid();
        return Ok(cacheWarmupService.GetStatus(jobId));
    }
}
