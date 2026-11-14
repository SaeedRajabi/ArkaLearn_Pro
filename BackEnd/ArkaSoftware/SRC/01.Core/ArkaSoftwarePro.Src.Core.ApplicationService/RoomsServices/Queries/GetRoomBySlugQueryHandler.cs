using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetRoomBySlug;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetRoomWithRoomId;
using Extensions.DependentyInjection.Abstractions;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RoomsServices.Queries
{
    public class GetRoomBySlugQueryHandler(ArkaSoftwareCMPOutServices mafiaOuterService,
        IRoomQueryRepository roomQueryRepository) : QueryHandler<GetRoomBySlugQuery, GetRoomByRoomIdQri>(mafiaOuterService)
    {
        public override async Task<QueryResult<GetRoomByRoomIdQri>> Handle(GetRoomBySlugQuery query)
        {
            try
            {
                var queryResult = await roomQueryRepository.GetRoomBySlugExecuteAsync(query);
                if (queryResult == null)
                    return await ResultAsync(null!, ApplicationServiceStatus.NotFound);
                return await ResultAsync(queryResult, ApplicationServiceStatus.Ok);
            }
            catch (Exception)
            {
                return await ResultAsync(null!, ApplicationServiceStatus.Exception);
            }
        }
    }
}
