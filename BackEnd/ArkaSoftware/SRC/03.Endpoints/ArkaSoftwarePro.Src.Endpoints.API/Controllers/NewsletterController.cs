using ArkaSoftwarePro.Src.Core.RequestResponse.Newsletter.Commands.ConfirmNewsletterSubscribe;
using ArkaSoftwarePro.Src.Core.RequestResponse.Newsletter.Commands.RequestNewsletterSubscribeOtp;
using ArkaSoftwarePro.Src.Core.RequestResponse.Newsletter.Commands.UnsubscribeNewsletter;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
public class NewsletterController : BaseController
{
    [HttpPost("Subscribe/SendOtp")]
    [AllowAnonymous]
    public async Task<IActionResult> SendSubscribeOtp([FromBody] RequestNewsletterSubscribeOtpCommand command)
        => await Create<RequestNewsletterSubscribeOtpCommand, object>(command);

    [HttpPost("Subscribe/Confirm")]
    [AllowAnonymous]
    public async Task<IActionResult> ConfirmSubscribe([FromBody] ConfirmNewsletterSubscribeCommand command)
        => await Create<ConfirmNewsletterSubscribeCommand, string>(command);

    [HttpPost("Unsubscribe")]
    [AllowAnonymous]
    public async Task<IActionResult> Unsubscribe([FromBody] UnsubscribeNewsletterCommand command)
        => await Create<UnsubscribeNewsletterCommand, string>(command);
}
