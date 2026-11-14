using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Endpoints.API.Common;
using Framework.Src.Endpoints.Web.Controllers;
using Framework.Src.Infrastructure.Payments.Zibal.Abstractions;
using Framework.Src.Infrastructure.Payments.Zibal.Models.Platform;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
[ApiController]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
public class ZibalPlatformController(IZibalPlatformClient zibalPlatformClient) : BaseController
{
  private readonly IZibalPlatformClient _zibalPlatformClient = zibalPlatformClient;

  private IActionResult ForbidUnlessAdmin()
    => User.IsDashboardAdminRole() ? null! : Forbid();

  [HttpGet("WalletList")]
  public async Task<IActionResult> WalletList(CancellationToken cancellationToken)
  {
    var forbid = ForbidUnlessAdmin();
    if (forbid != null) return forbid;

    var data = await _zibalPlatformClient.GetWalletListAsync(cancellationToken);
    return Ok(data);
  }

  [HttpPost("WalletBalance")]
  public async Task<IActionResult> WalletBalance([FromBody] ZibalWalletBalanceRequest request, CancellationToken cancellationToken)
  {
    var forbid = ForbidUnlessAdmin();
    if (forbid != null) return forbid;

    var data = await _zibalPlatformClient.GetWalletBalanceAsync(request.Id, cancellationToken);
    return Ok(data);
  }

  [HttpPost("CheckoutReport")]
  public async Task<IActionResult> CheckoutReport([FromBody] ZibalCheckoutReportRequest request, CancellationToken cancellationToken)
  {
    var forbid = ForbidUnlessAdmin();
    if (forbid != null) return forbid;

    var data = await _zibalPlatformClient.GetCheckoutReportAsync(request, cancellationToken);
    return Ok(data);
  }

  [HttpPost("CheckoutQueue")]
  public async Task<IActionResult> CheckoutQueue([FromBody] ZibalCheckoutQueueRequest request, CancellationToken cancellationToken)
  {
    var forbid = ForbidUnlessAdmin();
    if (forbid != null) return forbid;

    var data = await _zibalPlatformClient.GetCheckoutQueueAsync(request, cancellationToken);
    return Ok(data);
  }

  [HttpPost("CheckoutInquire")]
  public async Task<IActionResult> CheckoutInquire([FromBody] ZibalCheckoutInquireRequest request, CancellationToken cancellationToken)
  {
    var forbid = ForbidUnlessAdmin();
    if (forbid != null) return forbid;

    var data = await _zibalPlatformClient.InquireCheckoutAsync(request, cancellationToken);
    return Ok(data);
  }

  [HttpPost("GatewayTransactionReport")]
  public async Task<IActionResult> GatewayTransactionReport(
    [FromBody] ZibalGatewayTransactionReportRequest request,
    CancellationToken cancellationToken)
  {
    var forbid = ForbidUnlessAdmin();
    if (forbid != null) return forbid;

    var data = await _zibalPlatformClient.GetGatewayTransactionReportAsync(request, cancellationToken);
    return Ok(data);
  }

  [HttpPost("SubMerchantCreate")]
  public async Task<IActionResult> SubMerchantCreate([FromBody] ZibalSubMerchantCreateRequest request, CancellationToken cancellationToken)
  {
    var forbid = ForbidUnlessAdmin();
    if (forbid != null) return forbid;

    var data = await _zibalPlatformClient.CreateSubMerchantAsync(request, cancellationToken);
    return Ok(data);
  }

  [HttpPost("SubMerchantList")]
  public async Task<IActionResult> SubMerchantList([FromBody] ZibalSubMerchantListRequest request, CancellationToken cancellationToken)
  {
    var forbid = ForbidUnlessAdmin();
    if (forbid != null) return forbid;

    var data = await _zibalPlatformClient.ListSubMerchantsAsync(request.Page, request.Size, request.SubMerchant, cancellationToken);
    return Ok(data);
  }

  [HttpPost("SubMerchantEdit")]
  public async Task<IActionResult> SubMerchantEdit([FromBody] ZibalSubMerchantEditRequest request, CancellationToken cancellationToken)
  {
    var forbid = ForbidUnlessAdmin();
    if (forbid != null) return forbid;

    var data = await _zibalPlatformClient.EditSubMerchantAsync(request, cancellationToken);
    return Ok(data);
  }

  [HttpPost("Refund")]
  public async Task<IActionResult> Refund([FromBody] ZibalRefundRequest request, CancellationToken cancellationToken)
  {
    var forbid = ForbidUnlessAdmin();
    if (forbid != null) return forbid;

    var data = await _zibalPlatformClient.RefundAsync(request, cancellationToken);
    return Ok(data);
  }

  [HttpPost("RefundInquiry")]
  public async Task<IActionResult> RefundInquiry([FromBody] ZibalRefundInquiryRequest request, CancellationToken cancellationToken)
  {
    var forbid = ForbidUnlessAdmin();
    if (forbid != null) return forbid;

    var data = await _zibalPlatformClient.RefundInquiryAsync(request, cancellationToken);
    return Ok(data);
  }

  [HttpPost("RefundList")]
  public async Task<IActionResult> RefundList([FromBody] ZibalRefundListRequest request, CancellationToken cancellationToken)
  {
    var forbid = ForbidUnlessAdmin();
    if (forbid != null) return forbid;

    var data = await _zibalPlatformClient.RefundListAsync(request, cancellationToken);
    return Ok(data);
  }
}

public sealed class ZibalWalletBalanceRequest
{
  public int Id { get; set; }
}

public sealed class ZibalSubMerchantListRequest
{
  public int Page { get; set; } = 1;
  public int Size { get; set; } = 10;
  public ZibalSubMerchantFilter? SubMerchant { get; set; }
}
