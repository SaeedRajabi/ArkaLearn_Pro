using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportSubscription.Commands.GrantStudentSupportMonths;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportSubscription.Commands.RequestStudentSupportFreeze;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportSubscription.Commands.UpsertSupportPlanTariffs;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportSubscription.Queries.GetMyStudentSupportStatus;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportSubscription.Queries.GetSupportPlanTariffs;
using ArkaSoftwarePro.Src.Endpoints.API.Common;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
[ApiController]
public class SupportSubscriptionController : BaseController
{
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    [HttpGet("GetMyStatus")]
    public async Task<IActionResult> GetMyStatus()
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        return await Query<GetMyStudentSupportStatusQuery, StudentSupportStatusQri>(
            new GetMyStudentSupportStatusQuery { UserId = userId });
    }

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    [HttpPost("RequestFreeze")]
    public async Task<IActionResult> RequestFreeze([FromBody] RequestStudentSupportFreezeCommand command)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        command.UserId = userId;
        return await Create<RequestStudentSupportFreezeCommand, string>(command);
    }

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    [HttpPost("GrantMonths")]
    public async Task<IActionResult> GrantMonths([FromBody] GrantStudentSupportMonthsCommand command)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        command.ActorUserId = userId;
        command.ActorIsAdmin = User.IsDashboardAdminRole();
        return await Create<GrantStudentSupportMonthsCommand, string>(command);
    }

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    [HttpPost("UpsertPlanTariffs")]
    public async Task<IActionResult> UpsertPlanTariffs([FromBody] UpsertSupportPlanTariffsCommand command)
    {
        if (!User.IsDashboardAdminRole()) return Forbid();
        return await Edit<UpsertSupportPlanTariffsCommand, string>(command);
    }

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    [HttpGet("GetPlanTariffs")]
    public async Task<IActionResult> GetPlanTariffs()
    {
        if (!User.IsDashboardAdminRole()) return Forbid();
        return await Query<GetSupportPlanTariffsQuery, List<SupportPlanTariffQri>>(new GetSupportPlanTariffsQuery());
    }

    private bool TryGetCurrentUserId(out long userId)
    {
        userId = 0;
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? User.FindFirstValue("sub")
                  ?? User.FindFirstValue("userId");
        return long.TryParse(raw, out userId) && userId > 0;
    }
}
