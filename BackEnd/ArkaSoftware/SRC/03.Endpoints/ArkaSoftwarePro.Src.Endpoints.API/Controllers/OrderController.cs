using ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Commands.CreateDiscountCode;
using ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Commands.CreateOrderFromClientBasket;
using ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Commands.DeactivateDiscountCode;
using ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Commands.ValidateDiscountCode;
using ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Queries.GetOrderById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Queries.SearchDiscountCodes;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers
{
    [Route("api/Service/[controller]")]
    [ApiController]
    public class OrderController : BaseController
    {
        [HttpPost("CreateFromClientBasket")]
        [Authorize]
        public async Task<IActionResult> CreateFromClientBasket([FromBody] CreateOrderFromClientBasketCommand command)
        {
            return await Create<CreateOrderFromClientBasketCommand, string>(command);
        }

        [HttpPost("DiscountCode/Validate")]
        [AllowAnonymous]
        public async Task<IActionResult> ValidateDiscountCode([FromBody] ValidateDiscountCodeCommand command)
            => await Create<ValidateDiscountCodeCommand, object>(command);

        /// <summary>
        /// Admin dashboard uses cookie auth; allow both JWT and cookie like other admin endpoints.
        /// </summary>
        [HttpPost("DiscountCode/Add")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> AddDiscountCode([FromBody] CreateDiscountCodeCommand command)
            => await Create<CreateDiscountCodeCommand, object>(command);

        [HttpPost("DiscountCode/Deactivate")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> DeactivateDiscountCode([FromBody] DeactivateDiscountCodeCommand command)
            => await Create<DeactivateDiscountCodeCommand, object>(command);

        [HttpGet("DiscountCode/Search")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> SearchDiscountCodes([FromQuery] SearchDiscountCodesQuery query)
            => await Query<SearchDiscountCodesQuery, PagedData<DiscountCodeListItemQri>>(query);

        [HttpGet("GetById")]
        public async Task<IActionResult> GetById([FromQuery] long orderId)
        {
            var query = new GetOrderByIdQuery { OrderId = orderId };
            return await Query<GetOrderByIdQuery, GetOrderByIdQri>(query);
        }
    }
}
