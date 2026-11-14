using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Messages.Queries.GetAllMessageInRoom;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RoomsServices.Queries
{
    public class GetAllMessageWithRoomIdQueryHandler(
            ArkaSoftwareCMPOutServices mafiaOuterService, 
            IRoomQueryRepository roomQueryRepository,
            Microsoft.AspNetCore.Http.IHttpContextAccessor httpContextAccessor,
            ArkaSoftwarePro.Src.Core.Contracts.Rooms.IRoomAccessService roomAccess
            ): QueryHandler<GetAllMessageWithRoomIdQuery, PagedData<GetAllMessageWithRoomIdQri>>(mafiaOuterService)
    {
        public override async Task<QueryResult<PagedData<GetAllMessageWithRoomIdQri>>> Handle(GetAllMessageWithRoomIdQuery query)
        {
            try
            {
                if (!await roomAccess.CanAccessAsync(query.RoomId, httpContextAccessor.HttpContext?.User))
                    return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);
                var allMessageResult = await roomQueryRepository.GetAllMessageWithRoomId(query);
                if (allMessageResult == null!)
                    return await ResultAsync(null!, ApplicationServiceStatus.NotFound);
                return await ResultAsync(allMessageResult, ApplicationServiceStatus.Ok);


            }
            catch (Exception e)
            {
                return await ResultAsync(null!, ApplicationServiceStatus.Exception);
            }
        }
    }

}
