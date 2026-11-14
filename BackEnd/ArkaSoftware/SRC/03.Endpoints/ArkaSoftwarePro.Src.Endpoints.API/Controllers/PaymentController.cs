using ArkaSoftwarePro.Src.Core.ApplicationService.PaymentsServices;
using ArkaSoftwarePro.Src.Core.RequestResponse.Payments;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
[ApiController]
public class PaymentController(PaymentApplicationService payments) : BaseController
{
    [HttpPost("RequestWalletTopUp")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> RequestWalletTopUp([FromBody] WalletTopUpRequest request, CancellationToken cancellationToken)
        => ToActionResult(await payments.RequestWalletTopUp(request, cancellationToken));

    [HttpPost("RequestInvoicePayment")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> RequestInvoicePayment([FromBody] InvoicePaymentRequest request, CancellationToken cancellationToken)
        => ToActionResult(await payments.RequestInvoicePayment(request, cancellationToken));

    [HttpPost("RequestSeminarPayment")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> RequestSeminarPayment([FromBody] SeminarPaymentRequest request, CancellationToken cancellationToken)
        => ToActionResult(await payments.RequestSeminarPayment(request, cancellationToken));

    [HttpPost("RequestAdSubscriptionPayment")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> RequestAdSubscriptionPayment([FromBody] AdSubscriptionPaymentRequest request, CancellationToken cancellationToken)
        => ToActionResult(await payments.RequestAdSubscriptionPayment(request, cancellationToken));

    [HttpPost("RequestAdContactUnlockPayment")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> RequestAdContactUnlockPayment([FromBody] AdContactUnlockPaymentRequest request, CancellationToken cancellationToken)
        => ToActionResult(await payments.RequestAdContactUnlockPayment(request, cancellationToken));

    [HttpPost("RequestAdOneTimeBumpPayment")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> RequestAdOneTimeBumpPayment(CancellationToken cancellationToken)
        => ToActionResult(await payments.RequestAdOneTimeBumpPayment(cancellationToken));

    [HttpPost("RequestAdAutoBumpPackagePayment")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> RequestAdAutoBumpPackagePayment([FromBody] AdAutoBumpPackagePaymentRequest request, CancellationToken cancellationToken)
        => ToActionResult(await payments.RequestAdAutoBumpPackagePayment(request, cancellationToken));

    [HttpPost("RequestEducationPlanInstallmentPayment")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> RequestEducationPlanInstallmentPayment(
        [FromBody] EducationPlanInstallmentPaymentRequest request,
        CancellationToken cancellationToken)
        => ToActionResult(await payments.RequestEducationPlanInstallmentPayment(request, cancellationToken));

    [HttpPost("RequestCourseInstallmentPayment")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> RequestCourseInstallmentPayment(
        [FromBody] CourseInstallmentPaymentRequest request,
        CancellationToken cancellationToken)
        => ToActionResult(await payments.RequestCourseInstallmentPayment(request, cancellationToken));

    [HttpPost("RequestSupportPlanPayment")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> RequestSupportPlanPayment([FromBody] SupportPlanPaymentRequest request, CancellationToken cancellationToken)
        => ToActionResult(await payments.RequestSupportPlanPayment(request, cancellationToken));

    [HttpGet("Callback")]
    [AllowAnonymous]
    public async Task<IActionResult> Callback(
        [FromQuery(Name = "id")] string? paymentId,
        [FromQuery(Name = "order_id")] string? orderId,
        [FromQuery(Name = "Authority")] string? authority,
        [FromQuery(Name = "Status")] string? gatewayStatus,
        [FromQuery(Name = "trackId")] string? trackId,
        [FromQuery(Name = "success")] string? zibalSuccess,
        CancellationToken cancellationToken)
        => ToActionResult(await payments.Callback(paymentId, orderId, authority, gatewayStatus, trackId, zibalSuccess, cancellationToken));

    private IActionResult ToActionResult(PaymentOperationResult result) => result.Kind switch
    {
        PaymentOutcome.Success => Ok(result.Data),
        PaymentOutcome.ValidationError => BadRequest(result.Data),
        PaymentOutcome.Unauthorized => Unauthorized(),
        PaymentOutcome.Forbidden => Forbid(),
        PaymentOutcome.NotFound => NotFound(result.Data),
        PaymentOutcome.GatewayUnavailable => StatusCode(503, result.Data),
        PaymentOutcome.GatewayFailure => StatusCode(502, result.Data),
        PaymentOutcome.Redirect => Redirect(result.Url!),
        PaymentOutcome.Text => Content(result.Data?.ToString() ?? string.Empty),
        _ => throw new InvalidOperationException("Unsupported payment outcome."),
    };
}
