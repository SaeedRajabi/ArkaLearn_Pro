using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetRoomWithRoomId;
using Extensions.DependentyInjection.Abstractions;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RoomsServices.Queries
{
    public class GetRoomByRoomIdQueryHandler(ArkaSoftwareCMPOutServices mafiaOuterService,
        IRoomQueryRepository roomQueryRepository) : QueryHandler<GetRoomByRoomIdQuery, GetRoomByRoomIdQri>(mafiaOuterService)
    {


        public override async Task<QueryResult<GetRoomByRoomIdQri>> Handle(GetRoomByRoomIdQuery query)
        {
            try
            {
                var queryResult = await roomQueryRepository.GetRoomByRoomIdExecuteAsync(query);
                if (queryResult == null!)
                    return await ResultAsync(null!, ApplicationServiceStatus.NotFound);
                return await ResultAsync(queryResult!, ApplicationServiceStatus.Ok);
            }
            catch (Exception)
            {
                return await ResultAsync(null!, ApplicationServiceStatus.Exception);
            }
        }
    }
}
