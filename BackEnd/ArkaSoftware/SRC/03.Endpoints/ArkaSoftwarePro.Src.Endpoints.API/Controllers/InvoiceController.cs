using ArkaSoftwarePro.Src.Core.Contracts.Invoices.InvoiceRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Invoices.Commands.AddTransaction;
using ArkaSoftwarePro.Src.Core.RequestResponse.Invoices.Commands.CancelInvoice;
using ArkaSoftwarePro.Src.Core.RequestResponse.Invoices.Commands.CreateInvoice;
using ArkaSoftwarePro.Src.Core.RequestResponse.Invoices.Commands.IssueInvoice;
using ArkaSoftwarePro.Src.Core.RequestResponse.Invoices.Queries.GetInvoiceById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Invoices.Queries.GetMyInvoices;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers
{
    [Route("api/Service/[controller]")]
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public class InvoiceController(IInvoiceQueryRepository invoiceQueryRepository) : BaseController
    {
        [HttpGet("GetMyInvoices")]
        public async Task<IActionResult> GetMyInvoices([FromQuery] long? userId)
        {
            var tokenUserId = User.FindFirst("userId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (tokenUserId != null && long.TryParse(tokenUserId, out var uid))
                userId ??= uid;
            if (!userId.HasValue)
                return Unauthorized();

            var query = new GetMyInvoicesQuery { UserId = userId.Value };
            return await Query<GetMyInvoicesQuery, List<GetMyInvoicesQri>>(query);
        }

        [HttpGet("GetById")]
        public async Task<IActionResult> GetById([FromQuery] long invoiceId)
        {
            var query = new GetInvoiceByIdQuery { InvoiceId = invoiceId };
            return await Query<GetInvoiceByIdQuery, GetInvoiceByIdQri>(query);
        }

        [HttpGet("GetAdminInvoices")]
        public async Task<IActionResult> GetAdminInvoices()
            => Ok(await invoiceQueryRepository.GetAdminInvoicesAsync());

        [HttpGet("GetAdminPayments")]
        public async Task<IActionResult> GetAdminPayments()
            => Ok(await invoiceQueryRepository.GetAdminPaymentsAsync());

        [HttpPost("Create")]
        public async Task<IActionResult> Create([FromBody] CreateInvoiceRequest request)
        {
            var tokenUserId = User.FindFirst("userId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (tokenUserId == null || !long.TryParse(tokenUserId, out var uid))
                return Unauthorized();

            var command = new CreateInvoiceCommand
            {
                OrderId = request.OrderId,
                StudentId = uid,
                Description = request.Description
            };
            return await Create<CreateInvoiceCommand, string>(command);
        }

        [HttpPost("AddTransaction")]
        public async Task<IActionResult> AddTransaction([FromBody] AddTransactionCommand command)
            => await Create<AddTransactionCommand, string>(command);

        [HttpPost("Issue")]
        public async Task<IActionResult> Issue([FromBody] IssueInvoiceCommand command)
            => await Create<IssueInvoiceCommand, string>(command);

        [HttpPost("Cancel")]
        public async Task<IActionResult> Cancel([FromBody] CancelInvoiceCommand command)
            => await Create<CancelInvoiceCommand, string>(command);
    }

    public class CreateInvoiceRequest
    {
        public long OrderId { get; set; }
        public string? Description { get; set; }
    }
}
