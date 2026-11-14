using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.LoginUserIntoRoom;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.LogoutUserFromRoom;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Mvc;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.LoginUsers;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.LogoutUsers;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.ConfirmLoginTwoFactor;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.ResendLoginTwoFactorOtp;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.LoginByGoogleAccount;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.RenewDesktopSession;
using Microsoft.AspNetCore.Authorization;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Authentication;
using ArkaSoftwarePro.Src.Core.Contracts.Auth;
using ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityTokenContracts;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers
{
    [Route("api/Service/[controller]")]
    public class AccountController(
        DesktopWebHandoffService desktopWebHandoff,
        ILoginPuzzleCaptchaService loginPuzzleCaptcha,
        IUserDeviceInfoService userDeviceInfo) : BaseController
    {

        [HttpPost("Login")]
        [AllowAnonymous]
        public async Task<IActionResult> LoginUser([FromBody]LoginUser user)
        {
            return await Create<LoginUser, object>(user);
        }

        [HttpGet("LoginCaptcha/Challenge")]
        [AllowAnonymous]
        public IActionResult LoginCaptchaChallenge()
        {
            var ip = userDeviceInfo.GetUserInfo().IpAddress;
            var challenge = loginPuzzleCaptcha.CreateChallenge(ip);
            return Ok(new
            {
                captchaId = challenge.CaptchaId,
                targetPercent = challenge.TargetPercent,
                tolerancePercent = challenge.TolerancePercent,
            });
        }

        [HttpPost("LoginTwoFactor/Confirm")]
        [AllowAnonymous]
        public async Task<IActionResult> ConfirmLoginTwoFactor([FromBody] ConfirmLoginTwoFactorCommand command)
            => await Create<ConfirmLoginTwoFactorCommand, object>(command);

        [HttpPost("LoginTwoFactor/Resend")]
        [AllowAnonymous]
        public async Task<IActionResult> ResendLoginTwoFactor([FromBody] ResendLoginTwoFactorOtpCommand command)
            => await Create<ResendLoginTwoFactorOtpCommand, object>(command);

        [HttpPost("UserLoginIntoRoom")]
        [AllowAnonymous]
        public async Task<IActionResult> UserLogin([FromBody] LoginUserIntoRoomCommand loginUserIntoRoomCommand)
            => await Create<LoginUserIntoRoomCommand, object>(loginUserIntoRoomCommand);

        [HttpPost("Google-Login")]
        [AllowAnonymous]
        public async Task<IActionResult> GoogleAuthLogin([FromBody] LoginByGoogleAccountCommand tokenCommand)
            => await Create<LoginByGoogleAccountCommand, object>(tokenCommand);

        /// <summary>
        /// Desktop auto-login: renew access JWT while the server UserSession is still valid.
        /// </summary>
        [HttpPost("RenewDesktopSession")]
        [AllowAnonymous]
        public async Task<IActionResult> RenewDesktopSession([FromBody] RenewDesktopSessionCommand command)
            => await Create<RenewDesktopSessionCommand, object>(command);

        [HttpGet("Google-ClientId")]
        [AllowAnonymous]
        public async Task<IActionResult> GoogleClientId(
            [FromServices] ArkaSoftwarePro.Src.Core.Contracts.GoogleAuthSettings.IGoogleAuthSettingsProvider googleAuthSettings,
            CancellationToken cancellationToken)
        {
            var options = await googleAuthSettings.GetOptionsAsync(cancellationToken);
            if (!options.IsConfigured)
                return NotFound(new { message = "Google sign-in is not configured." });
            return Ok(new { clientId = options.ClientId });
        }

        /// <summary>
        /// Desktop creates a short-lived one-time code so the browser opens already authenticated.
        /// </summary>
        [Authorize]
        [HttpPost("CreateWebHandoff")]
        public async Task<IActionResult> CreateWebHandoff([FromBody] CreateWebHandoffBody? body, CancellationToken cancellationToken)
        {
            var userId = ResolveUserId();
            if (userId <= 0) return Unauthorized();

            var created = await desktopWebHandoff.CreateAsync(userId, body?.ReturnUrl, cancellationToken);
            if (created is null)
                return BadRequest(new { message = "Unable to create web handoff." });

            return Ok(new
            {
                code = created.Value.Code,
                expiresAtUtc = created.Value.ExpiresAtUtc,
            });
        }

        /// <summary>
        /// Browser consumes the one-time code, sets auth cookies, and returns login-shaped userData.
        /// </summary>
        [AllowAnonymous]
        [HttpPost("ConsumeWebHandoff")]
        public async Task<IActionResult> ConsumeWebHandoff([FromBody] ConsumeWebHandoffBody? body, CancellationToken cancellationToken)
        {
            var result = await desktopWebHandoff.ConsumeAsync(body?.Code, cancellationToken);
            if (result is null)
                return Unauthorized(new { message = "Handoff code is invalid or expired." });

            return Ok(result);
        }

        [HttpPost("Logout")]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

            var deleteOptions = BuildAuthCookieDeleteOptions();
            Response.Cookies.Delete("authToken", deleteOptions);
            Response.Cookies.Delete("AuthCookie", deleteOptions);

            return Ok(new { message = "Logout successful" });
        }

        private CookieOptions BuildAuthCookieDeleteOptions()
        {
            return new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Path = "/",
                Expires = DateTimeOffset.UnixEpoch,
            };
        }

        private long ResolveUserId()
        {
            var raw = User.FindFirstValue("userId")
                      ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
                      ?? User.FindFirstValue("sub");
            return long.TryParse(raw, out var id) ? id : 0;
        }

        [HttpPost("UserRoomLogout")]
        [Authorize]
        public async Task<IActionResult> RoomUserLogout([FromBody]LogoutUserFromRoomCommand logoutUserFromRoomCommand)
        {
            return await Edit<LogoutUserFromRoomCommand, object>(logoutUserFromRoomCommand);
        }

        [HttpGet("get-token")]
        public IActionResult GetToken()
        {
            if (Request.Cookies.TryGetValue("authToken", out var token))
            {
                return Ok(new { token });
            }

            return Unauthorized(new { message = "Token not found" });
        }

        [HttpGet("access-denied")]
        public IActionResult AccessDenied()
        {
            return Ok("Access Denied.");
        }

        #region Clear GC Methods
        [HttpGet("Clear")]
        public bool Clear()
        {
            GC.Collect(2);
            return true;
        }
        #endregion
    }

    public sealed class CreateWebHandoffBody
    {
        public string? ReturnUrl { get; set; }
    }

    public sealed class ConsumeWebHandoffBody
    {
        public string? Code { get; set; }
    }
}
