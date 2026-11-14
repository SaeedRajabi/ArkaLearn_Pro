using System.Security.Claims;

using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Commands.AddEducationPlans;

using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Commands.DeleteEducationPlan;

using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Commands.EnterEducationPlanRoom;

using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Commands.UpdateEducationPlan;

using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Queries.GetEducationPlanById;

using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Queries.GetMyEducationPlanById;

using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Queries.GetMyEducationPlans;

using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Queries.SearchEducationPlanWithInputValue;

using Framework.Src.Core.RequestResponse.Common;
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

    public class EducationPlanController : BaseController

    {

        [HttpPost]

        [Route("Add-Plan")]

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]

        public async Task<IActionResult> AddEducationPlan([FromBody] AddEducationPlanCommand coursePlan)

            => await Create<AddEducationPlanCommand, string>(coursePlan);



        [HttpPut]
        [HttpPost]
        [Route("Update-Plan")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> UpdateEducationPlan([FromBody] UpdateEducationPlanCommand command)
            => await Edit<UpdateEducationPlanCommand, bool>(command);



        [HttpDelete]
        [HttpPost]
        [Route("Delete-Plan")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> DeleteEducationPlan([FromQuery] long planId)
            => await Edit<DeleteEducationPlanCommand, bool>(new DeleteEducationPlanCommand { PlanId = planId });



        [HttpGet("Plan-Search")]

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]

        public async Task<IActionResult> SearchEducationPlans([FromQuery] SearchEducationPlanByInputValueQuery courseQuery)

            => await Query<SearchEducationPlanByInputValueQuery, PagedData<SearchEducationPlanQri>>(courseQuery);



        [HttpGet("GetById")]

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]

        public async Task<IActionResult> GetEducationPlanById([FromQuery] long planId)

            => await Query<GetEducationPlanByIdQuery, GetEducationPlanByIdQri>(new GetEducationPlanByIdQuery { PlanId = planId });



        /// <summary>Private education plans assigned to the current student.</summary>

        [HttpGet("GetMyPlans")]

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]

        public async Task<IActionResult> GetMyEducationPlans()

        {

            if (!TryGetCurrentUserId(out var userId))

                return Unauthorized(new { message = "User is not authenticated." });



            return await Query<GetMyEducationPlansQuery, List<MyEducationPlanQri>>(

                new GetMyEducationPlansQuery { UserId = userId });

        }



        [HttpGet("GetMyPlanById")]

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]

        public async Task<IActionResult> GetMyEducationPlanById([FromQuery] long planId)

        {

            if (!TryGetCurrentUserId(out var userId))

                return Unauthorized(new { message = "User is not authenticated." });



            return await Query<GetMyEducationPlanByIdQuery, GetEducationPlanByIdQri>(

                new GetMyEducationPlanByIdQuery { PlanId = planId, UserId = userId });

        }



        [HttpPost("EnterRoom")]

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]

        public async Task<IActionResult> EnterEducationPlanRoom([FromBody] EnterEducationPlanRoomRequest request)

        {

            if (!TryGetCurrentUserId(out var userId))

                return Unauthorized(new { message = "User is not authenticated." });



            var result = await CommandDispatcher.Send<EnterEducationPlanRoomCommand, EnterEducationPlanRoomResult>(

                new EnterEducationPlanRoomCommand { PlanId = request.PlanId, UserId = userId });



            if (result.Status == ApplicationServiceStatus.Ok)

                return Ok(result.Data);



            var message = result.Messages.FirstOrDefault() ?? "You cannot enter this room for this plan.";

            if (result.Status == ApplicationServiceStatus.NotFound)

                return NotFound(new { message });



            return StatusCode(StatusCodes.Status403Forbidden, new { message });

        }



        private bool TryGetCurrentUserId(out long userId)

        {

            var claimValue = User.FindFirst("userId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            return long.TryParse(claimValue, out userId);

        }

    }



    public class EnterEducationPlanRoomRequest

    {

        public long PlanId { get; set; }

    }

}


