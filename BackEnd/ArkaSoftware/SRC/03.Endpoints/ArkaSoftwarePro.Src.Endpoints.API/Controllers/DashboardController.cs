using ArkaSoftwarePro.Src.Core.RequestResponse.Dashboard.Queries.GetDashboardStats;
using ArkaSoftwarePro.Src.Core.RequestResponse.Dashboard.Queries.GetDashboardOverview;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers
{
    [Route("api/Service/[controller]")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public class DashboardController : BaseController
    {
        [HttpGet("GetStats")]
        public async Task<IActionResult> GetStats([FromQuery] GetDashboardStatsQuery query)
            => await Query<GetDashboardStatsQuery, GetDashboardStatsQri>(query);

        [HttpGet("GetOverview")]
        public async Task<IActionResult> GetOverview([FromQuery] GetDashboardOverviewQuery query)
            => await Query<GetDashboardOverviewQuery, GetDashboardOverviewQri>(query);
    }
}