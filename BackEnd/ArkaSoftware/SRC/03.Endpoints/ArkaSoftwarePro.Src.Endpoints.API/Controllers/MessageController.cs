using ArkaSoftwarePro.Src.Core.RequestResponse.Messages.Commands.SendMessage;
using ArkaSoftwarePro.Src.Core.RequestResponse.Messages.Queries.GetAllMessageInRoom;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers
{
    [Route("api/[controller]")]
    
    [Authorize]
    public class MessageController : BaseController
    {

        [HttpPost("send")]
        public async Task<IActionResult> SendMessage([FromBody] SendMessageCommand sendMessageCommand)
        {
            return await Create<SendMessageCommand ,string>(sendMessageCommand);
        }

        [HttpGet("Search")]
        public async Task<IActionResult> SearchCourses([FromQuery] GetAllMessageWithRoomIdQuery allMessageWithRoomIdQuery)
            => await Query<GetAllMessageWithRoomIdQuery, PagedData<GetAllMessageWithRoomIdQri>>(allMessageWithRoomIdQuery);
    }
}
