using ArkaSoftwarePro.Src.Core.RequestResponse.Baskets.Commands.AddCoursesToBasket;
using ArkaSoftwarePro.Src.Core.RequestResponse.Baskets.Queries.GetBasketCourseById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Baskets.Queries.GetMyBasket;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers
{
    [Route("api/Service/[controller]")]
    public class BasketController : BaseController
    {
        [HttpPost("AddCourseToBasket")]
        public async Task<IActionResult> AddCourseToBasket([FromBody] AddCourseToBasketCommand addCourseToBasket)
        {
            return await Create<AddCourseToBasketCommand, string>(addCourseToBasket);
        }

        [HttpGet("GetBasketCoursesById")]
        public async Task<IActionResult> GetBasketCoursesById([FromQuery] GetBasketCourseByIdQuery basketItems)
            => await Query<GetBasketCourseByIdQuery, List<GetBasketCoursesQri>>(basketItems);

        [HttpGet("GetMyBasket")]
        public async Task<IActionResult> GetMyBasket()
            => await Query<GetMyBasketQuery, List<GetBasketCoursesQri>>(new GetMyBasketQuery());
    }
}
