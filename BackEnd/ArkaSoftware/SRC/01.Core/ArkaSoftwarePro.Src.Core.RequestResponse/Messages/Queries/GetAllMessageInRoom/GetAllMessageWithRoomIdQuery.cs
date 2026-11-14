using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Messages.Queries.GetAllMessageInRoom
{
    public class GetAllMessageWithRoomIdQuery:PageQuery<PagedData<GetAllMessageWithRoomIdQri>> ,IWebRequest
    {
        public long RoomId { get; set; }
        public string InputValue { get; set; } = string.Empty;
        public string Path => "/api/Service/Message/GetAll";
    }
}
