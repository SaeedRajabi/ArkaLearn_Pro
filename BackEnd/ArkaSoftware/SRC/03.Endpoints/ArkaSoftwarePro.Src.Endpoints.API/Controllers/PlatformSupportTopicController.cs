using ArkaSoftwarePro.Src.Core.RequestResponse.PlatformSupportTopics.Commands.DeletePlatformSupportTopic;
using ArkaSoftwarePro.Src.Core.RequestResponse.PlatformSupportTopics.Commands.UpsertPlatformSupportTopic;
using ArkaSoftwarePro.Src.Core.RequestResponse.PlatformSupportTopics.Queries.GetPlatformSupportTopicById;
using ArkaSoftwarePro.Src.Core.RequestResponse.PlatformSupportTopics.Queries.ListPlatformSupportTopics;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
public class PlatformSupportTopicController : BaseController
{
    [HttpGet("ListPublished")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> ListPublished([FromQuery] ListPublishedPlatformSupportTopicsQuery query)
        => await Query<ListPublishedPlatformSupportTopicsQuery, List<PlatformSupportTopicListItemQri>>(query);

    [HttpGet("GetPublishedById")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetPublishedById([FromQuery] GetPublishedPlatformSupportTopicByIdQuery query)
        => await Query<GetPublishedPlatformSupportTopicByIdQuery, PlatformSupportTopicDetailQri>(query);

    [HttpGet("List")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> List([FromQuery] ListPlatformSupportTopicsQuery query)
        => await Query<ListPlatformSupportTopicsQuery, List<PlatformSupportTopicListItemQri>>(query);

    [HttpGet("GetById")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetById([FromQuery] GetPlatformSupportTopicByIdQuery query)
        => await Query<GetPlatformSupportTopicByIdQuery, PlatformSupportTopicDetailQri>(query);

    [HttpPost("Upsert")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Upsert([FromBody] UpsertPlatformSupportTopicCommand command)
        => await Create<UpsertPlatformSupportTopicCommand, string>(command);

    [HttpPost("Delete")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Delete([FromBody] DeletePlatformSupportTopicCommand command)
        => await Create<DeletePlatformSupportTopicCommand, string>(command);
}
