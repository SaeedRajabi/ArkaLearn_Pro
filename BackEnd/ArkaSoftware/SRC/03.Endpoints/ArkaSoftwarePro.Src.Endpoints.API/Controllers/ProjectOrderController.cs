using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.ApplicationService.FileStorage;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectOrders.Commands.ReviewProjectOrder;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectOrders.Commands.SubmitProjectOrder;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectOrders.Queries.GetMyProjectOrderById;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectOrders.Queries.GetMyProjectOrders;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectOrders.Queries.GetProjectOrderById;
using ProjectOrderQri = ArkaSoftwarePro.Src.Core.RequestResponse.ProjectOrders.Queries.GetProjectOrderById.ProjectOrderQri;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectOrders.Queries.SearchProjectOrders;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
[ApiController]
public class ProjectOrderController(FileStoragePathSaver pathSaver) : BaseController
{
    [HttpPost("Submit")]
    [AllowAnonymous]
    public async Task<IActionResult> Submit([FromBody] SubmitProjectOrderCommand command)
        => await Create<SubmitProjectOrderCommand, string>(command);

    [HttpPut("Review")]
    [HttpPost("Review")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Review([FromBody] ReviewProjectOrderCommand command)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "User is not authenticated." });

        command.ReviewerUserId = userId;
        return await Edit<ReviewProjectOrderCommand, string>(command);
    }

    [HttpGet("GetMyOrders")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetMyOrders()
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "User is not authenticated." });

        return await Query<GetMyProjectOrdersQuery, List<MyProjectOrderQri>>(
            new GetMyProjectOrdersQuery { UserId = userId });
    }

    [HttpGet("GetMyOrderById")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetMyOrderById([FromQuery] long orderId)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "User is not authenticated." });

        return await Query<GetMyProjectOrderByIdQuery, ProjectOrderQri>(
            new GetMyProjectOrderByIdQuery { UserId = userId, OrderId = orderId });
    }

    [HttpGet("GetById")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetById([FromQuery] long orderId)
        => await Query<GetProjectOrderByIdQuery, ProjectOrderQri>(
            new GetProjectOrderByIdQuery { OrderId = orderId });

    [HttpGet("Search")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Search([FromQuery] SearchProjectOrdersQuery query)
        => await Query<SearchProjectOrdersQuery, PagedData<SearchProjectOrderQri>>(query);

    [HttpPost("UploadDescriptionImage")]
    [ApiExplorerSettings(IgnoreApi = true)]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> UploadDescriptionImage(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("File is required.");
        var url = await pathSaver.SavePublicAsync(file, "images/project-orders");
        return Ok(new { url });
    }

    private bool TryGetCurrentUserId(out long userId)
    {
        var claimValue = User.FindFirst("userId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return long.TryParse(claimValue, out userId);
    }
}
