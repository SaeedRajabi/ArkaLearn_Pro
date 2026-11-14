using ArkaSoftwarePro.Src.Core.RequestResponse.Email.Commands.ConfirmEmailChange;
using ArkaSoftwarePro.Src.Core.RequestResponse.Email.Commands.ConfirmProfileEmailVerification;
using ArkaSoftwarePro.Src.Core.RequestResponse.Email.Commands.SendEmailChangeOtp;
using ArkaSoftwarePro.Src.Core.RequestResponse.Email.Commands.SendProfileEmailVerificationOtp;using ArkaSoftwarePro.Src.Core.Contracts.Services;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices;
using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Endpoints.API.Extensions;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Email;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
[ApiController]
public class EmailController(
    IEmailService emailService,
    IOptions<SmtpEmailOptions> smtpOptions,
    SmtpConnectionDiagnostics diagnostics,
    IWebHostEnvironment environment) : BaseController
{
    public sealed class TestEmailRequest
    {
        public string ToEmail { get; set; } = string.Empty;
        public string RecipientName { get; set; } = "Test User";
    }

    public sealed class DiagnoseEmailRequest
    {
        public string? ToEmail { get; set; }
    }

    [HttpGet("Status")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public IActionResult Status()
    {
        var opts = smtpOptions.Value;
        return Ok(new
        {
            enabled = opts.Enabled,
            configured = opts.IsConfigured,
            host = opts.Host,
            port = opts.Port,
            useSsl = opts.UseSsl,
            useStartTls = opts.UseStartTls,
            fromEmail = opts.FromEmail,
            username = opts.Username,
            provider = opts.IsConfigured ? "smtp" : "noop",
            environment = environment.EnvironmentName,
            hint = opts.Host.Contains("gmail", StringComparison.OrdinalIgnoreCase) && opts.Username.Contains("arkasoftware", StringComparison.OrdinalIgnoreCase)
                ? "Host looks like Gmail but mailbox is on your domain. Use mail.arkasoftware.ir from Plesk."
                : null
        });
    }

    [HttpPost("Diagnose")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Diagnose([FromBody] DiagnoseEmailRequest? request, CancellationToken cancellationToken)
    {
        var result = await diagnostics.RunAsync(request?.ToEmail, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("Test")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> TestSend([FromBody] TestEmailRequest request, CancellationToken cancellationToken)
    {
        if (!smtpOptions.Value.IsConfigured)
            return BadRequest(new { message = "SMTP is not configured. Set Smtp:Host, credentials, and restart the API." });

        var toEmail = (request.ToEmail ?? string.Empty).Trim();
        if (!toEmail.Contains('@'))
            return BadRequest(new { message = "A valid ToEmail is required." });

        try
        {
            var code = Random.Shared.Next(100000, 999999).ToString();
            await emailService.SendVerificationCodeAsync(
                toEmail,
                string.IsNullOrWhiteSpace(request.RecipientName) ? "Test User" : request.RecipientName.Trim(),
                code,
                cancellationToken);

            return Ok(new
            {
                message = "Test verification email sent.",
                toEmail,
                codeSent = environment.IsDevelopment() ? code : null
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                message = SmtpConnectionDiagnostics.DescribeSmtpException(ex),
                detail = ex.Message
            });
        }
    }

    [HttpPost("ProfileVerification/Send")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> SendProfileVerificationOtp([FromBody] SendProfileEmailVerificationOtpCommand command)
        => await Create<SendProfileEmailVerificationOtpCommand, object>(command);

    [HttpPost("ProfileVerification/Confirm")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> ConfirmProfileVerification([FromBody] ConfirmProfileEmailVerificationCommand command)
        => await Create<ConfirmProfileEmailVerificationCommand, string>(command);

    [HttpPost("EmailChange/Send")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> SendEmailChangeOtp([FromBody] SendEmailChangeOtpCommand command)
        => await Create<SendEmailChangeOtpCommand, object>(command);

    [HttpPost("EmailChange/Confirm")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> ConfirmEmailChange([FromBody] ConfirmEmailChangeCommand command)
        => await Create<ConfirmEmailChangeCommand, string>(command);
}
