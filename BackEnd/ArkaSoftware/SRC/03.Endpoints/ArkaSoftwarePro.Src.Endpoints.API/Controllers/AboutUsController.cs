using ArkaSoftwarePro.Src.Core.RequestResponse.AboutUs.Commands.UpsertAboutUs;
using ArkaSoftwarePro.Src.Core.RequestResponse.AboutUs.Queries.GetAboutUs;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers
{
    [Route("api/Service/[controller]")]
    public class AboutUsController : BaseController
    {
        [HttpGet("Get")]
        public async Task<IActionResult> Get([FromQuery] GetAboutUsQuery query)
            => await Query<GetAboutUsQuery, AboutUsQri>(query);

        [HttpPost("Upsert")]
        [RequestSizeLimit(52_428_800)]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> Upsert([FromForm] UpsertAboutUsCommand command)
            => await Create<UpsertAboutUsCommand, string>(command);
    }
}
