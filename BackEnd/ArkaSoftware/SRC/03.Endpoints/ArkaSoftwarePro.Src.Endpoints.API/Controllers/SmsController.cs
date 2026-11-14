using ArkaSoftwarePro.Src.Core.RequestResponse.Sms.Commands.ConfirmPhoneChange;
using ArkaSoftwarePro.Src.Core.RequestResponse.Sms.Commands.ConfirmProfilePhoneVerification;
using ArkaSoftwarePro.Src.Core.RequestResponse.Sms.Commands.SendPhoneChangeOtp;
using ArkaSoftwarePro.Src.Core.RequestResponse.Sms.Commands.SendProfilePhoneVerificationOtp;
using ArkaSoftwarePro.Src.Core.RequestResponse.Sms.Commands.SendProjectOrderOtp;
using ArkaSoftwarePro.Src.Core.RequestResponse.Sms.Commands.SendRegistrationOtp;
using ArkaSoftwarePro.Src.Core.RequestResponse.Sms.Commands.VerifyProjectOrderOtp;
using ArkaSoftwarePro.Src.Core.RequestResponse.Sms.Queries.GetRegistrationSmsConfig;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
public class SmsController : BaseController
{
    [HttpGet("Registration/Config")]
    [AllowAnonymous]
    public async Task<IActionResult> GetRegistrationConfig([FromQuery] GetRegistrationSmsConfigQuery query)
        => await Query<GetRegistrationSmsConfigQuery, RegistrationSmsConfigQri>(query);

    [HttpPost("Registration/Send")]
    [AllowAnonymous]
    public async Task<IActionResult> SendRegistrationOtp([FromBody] SendRegistrationOtpCommand command)
        => await Create<SendRegistrationOtpCommand, object>(command);

    [HttpPost("ProjectOrder/Send")]
    [AllowAnonymous]
    public async Task<IActionResult> SendProjectOrderOtp([FromBody] SendProjectOrderOtpCommand command)
        => await Create<SendProjectOrderOtpCommand, object>(command);

    [HttpPost("ProjectOrder/Verify")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyProjectOrderOtp([FromBody] VerifyProjectOrderOtpCommand command)
        => await Create<VerifyProjectOrderOtpCommand, object>(command);

    [HttpPost("PhoneChange/Send")]
    [Authorize]
    public async Task<IActionResult> SendPhoneChangeOtp([FromBody] SendPhoneChangeOtpCommand command)
        => await Create<SendPhoneChangeOtpCommand, object>(command);

    [HttpPost("PhoneChange/Confirm")]
    [Authorize]
    public async Task<IActionResult> ConfirmPhoneChange([FromBody] ConfirmPhoneChangeCommand command)
        => await Create<ConfirmPhoneChangeCommand, string>(command);

    [HttpPost("ProfileVerification/Send")]
    [Authorize]
    public async Task<IActionResult> SendProfileVerificationOtp([FromBody] SendProfilePhoneVerificationOtpCommand command)
        => await Create<SendProfilePhoneVerificationOtpCommand, object>(command);

    [HttpPost("ProfileVerification/Confirm")]
    [Authorize]
    public async Task<IActionResult> ConfirmProfileVerification([FromBody] ConfirmProfilePhoneVerificationCommand command)
        => await Create<ConfirmProfilePhoneVerificationCommand, string>(command);
}
