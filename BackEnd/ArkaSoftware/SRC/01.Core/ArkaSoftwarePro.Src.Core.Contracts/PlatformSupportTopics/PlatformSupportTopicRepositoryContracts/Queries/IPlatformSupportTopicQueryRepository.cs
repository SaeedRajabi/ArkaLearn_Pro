using ArkaSoftwarePro.Src.Core.RequestResponse.PlatformSupportTopics.Queries.GetPlatformSupportTopicById;
using ArkaSoftwarePro.Src.Core.RequestResponse.PlatformSupportTopics.Queries.ListPlatformSupportTopics;

namespace ArkaSoftwarePro.Src.Core.Contracts.PlatformSupportTopics.PlatformSupportTopicRepositoryContracts.Queries;

public interface IPlatformSupportTopicQueryRepository
{
    Task<IReadOnlyList<PlatformSupportTopicListItemQri>> ListAllAsync();
    Task<IReadOnlyList<PlatformSupportTopicListItemQri>> ListPublishedAsync();
    Task<PlatformSupportTopicDetailQri?> GetByIdAsync(long id, bool publishedOnly);
}
