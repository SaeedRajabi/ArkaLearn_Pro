using ArkaSoftwarePro.Src.Core.RequestResponse.IPBlacklist.Commands.RemoveIPFromBlacklist;
using ArkaSoftwarePro.Src.Core.RequestResponse.IPBlacklist.Queries.SearchIPBlacklists;
using ArkaSoftwarePro.Src.Core.RequestResponse.Security.Commands.SendIpUnblockOtp;
using ArkaSoftwarePro.Src.Core.RequestResponse.Security.Commands.SubmitIpUnblockRequest;
using ArkaSoftwarePro.Src.Core.RequestResponse.Security.Queries.GetIpStatus;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
public class SecurityController : BaseController
{
    [HttpGet("IpStatus")]
    [AllowAnonymous]
    public async Task<IActionResult> GetIpStatus([FromQuery] GetIpStatusQuery query)
        => await Query<GetIpStatusQuery, IpStatusQri>(query);

    [HttpPost("IpUnblockOtp/Send")]
    [AllowAnonymous]
    public async Task<IActionResult> SendIpUnblockOtp([FromBody] SendIpUnblockOtpCommand command)
        => await Create<SendIpUnblockOtpCommand, IpUnblockOtpSessionQri>(command);

    [HttpPost("IpUnblock/Submit")]
    [AllowAnonymous]
    public async Task<IActionResult> SubmitIpUnblockRequest([FromBody] SubmitIpUnblockRequestCommand command)
        => await Create<SubmitIpUnblockRequestCommand, string>(command);

    [HttpGet("IPBlacklist/Search")]
    [Authorize]
    public async Task<IActionResult> SearchIPBlacklists([FromQuery] SearchIPBlacklistsQuery query)
        => await Query<SearchIPBlacklistsQuery, PagedData<IPBlacklistListItemQri>>(query);

    [HttpPost("IPBlacklist/Remove")]
    [Authorize]
    public async Task<IActionResult> RemoveIPFromBlacklist([FromBody] RemoveIPFromBlacklistCommand command)
        => await Create<RemoveIPFromBlacklistCommand, string>(command);
}
