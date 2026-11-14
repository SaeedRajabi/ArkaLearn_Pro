using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetRoomFilesByRoomId;
using Extensions.DependentyInjection.Abstractions;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RoomsServices.Queries
{
    public class GetRoomFilesByRoomIdQueryHandler(ArkaSoftwareCMPOutServices mafiaOuterService,
        IRoomQueryRepository roomQueryRepository) : QueryHandler<GetRoomFilesByRoomIdQuery, List<GetRoomFilesByRoomIdQri>>(mafiaOuterService)
    {
        public override async Task<QueryResult<List<GetRoomFilesByRoomIdQri>>> Handle(GetRoomFilesByRoomIdQuery query)
        {
            try
            {
                var list = await roomQueryRepository.GetRoomFilesByRoomIdExecuteAsync(query);
                return await ResultAsync(list ?? new List<GetRoomFilesByRoomIdQri>(), ApplicationServiceStatus.Ok);
            }
            catch (Exception)
            {
                return await ResultAsync(new List<GetRoomFilesByRoomIdQri>(), ApplicationServiceStatus.Exception);
            }
        }
    }
}
