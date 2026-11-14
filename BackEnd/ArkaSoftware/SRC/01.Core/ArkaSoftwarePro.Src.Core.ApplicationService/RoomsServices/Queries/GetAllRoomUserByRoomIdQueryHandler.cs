using ArkaSoftwarePro.Src.Core.Contracts.Rooms;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetAllRoomUsersWithRoomId;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RoomsServices.Queries
{
    public class GetAllRoomUserByRoomIdQueryHandler(
        ArkaSoftwareCMPOutServices mafiaOuterService,
        IRoomQueryRepository roomQueryRepository,
        IRoomSeatLivePresence roomSeatLivePresence)
        : QueryHandler<GetAllRoomUserByRoomIdQuery, PagedData<GetAllRoomUserByRoomIdQri>>(mafiaOuterService)
    {
        public override async Task<QueryResult<PagedData<GetAllRoomUserByRoomIdQri>>> Handle(GetAllRoomUserByRoomIdQuery query)
        {
            try
            {
                
                var allUsersInRoomResult = await roomQueryRepository.GetAllRoomUserByRoomIdExecuteAsync(query);
                if (allUsersInRoomResult == null!)
                    return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

                if (allUsersInRoomResult.QueryResult != null)
                {
                    foreach (var seat in allUsersInRoomResult.QueryResult)
                        seat.IsOnline = roomSeatLivePresence.IsSeatLive(query.RoomId, seat.RoomUserId);
                }

                return await ResultAsync(allUsersInRoomResult, ApplicationServiceStatus.Ok);


            }
            catch (Exception e)
            {
                return await ResultAsync(null!, ApplicationServiceStatus.Exception);
            }
        }
    }
}
