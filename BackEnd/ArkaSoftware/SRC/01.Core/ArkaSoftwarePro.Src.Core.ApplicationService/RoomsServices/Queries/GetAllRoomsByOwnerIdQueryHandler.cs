using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetAllRoomsWithOwnerId;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RoomsServices.Queries
{
    public class GetAllRoomsByOwnerIdQueryHandler(
        ArkaSoftwareCMPOutServices mafiaOuterService,
        IRoomQueryRepository roomQueryRepository)
        : QueryHandler<GetAllRoomsByOwnerIdQuery, PagedData<GetAllRoomsByOwnerIdQri>>(mafiaOuterService)
    {
        public override async Task<QueryResult<PagedData<GetAllRoomsByOwnerIdQri>>> Handle(GetAllRoomsByOwnerIdQuery query)
        {
            try
            {
                var result = await roomQueryRepository.GetAllOwnerRoomExecuteAsync(query);
                if (result is null)
                    return await ResultAsync(null!, ApplicationServiceStatus.NotFound);
                return await ResultAsync(result, ApplicationServiceStatus.Ok);
            }
            catch
            {
                return await ResultAsync(null!, ApplicationServiceStatus.Exception);

            }
        }
    }
}
