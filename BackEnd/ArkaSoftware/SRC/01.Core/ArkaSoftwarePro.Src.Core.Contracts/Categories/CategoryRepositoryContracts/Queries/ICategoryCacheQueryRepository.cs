using ArkaSoftwarePro.Src.Core.RequestResponse.Messages.Queries.GetAllMessageInRoom;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.Categories.CategoryRepositoryContracts.Queries
{
    public interface ICategoryCacheQueryRepository
    {
        Task<PagedData<GetAllMessageWithRoomIdQri>> SearchCategoryCacheAsync(GetAllMessageWithRoomIdQuery query);
    }
}
