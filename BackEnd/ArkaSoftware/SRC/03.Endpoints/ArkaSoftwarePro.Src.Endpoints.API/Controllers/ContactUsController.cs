using ArkaSoftwarePro.Src.Core.RequestResponse.ContactUs.Commands.UpsertContactUs;
using ArkaSoftwarePro.Src.Core.RequestResponse.ContactUs.Queries.GetContactUs;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers
{
    [Route("api/Service/[controller]")]
    public class ContactUsController : BaseController
    {
        [HttpGet("Get")]
        public async Task<IActionResult> Get([FromQuery] GetContactUsQuery query)
            => await Query<GetContactUsQuery, ContactUsQri>(query);

        [HttpPost("Upsert")]
        [HttpPut("Upsert")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> Upsert([FromBody] UpsertContactUsCommand command)
            => await Create<UpsertContactUsCommand, string>(command);
    }
}
