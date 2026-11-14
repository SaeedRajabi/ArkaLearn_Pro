using ArkaSoftwarePro.Src.Core.Domain.PlatformSupportTopicAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.PlatformSupportTopics.PlatformSupportTopicRepositoryContracts.Commands;

public interface IPlatformSupportTopicCommandRepository : ICommandRepository<PlatformSupportTopic, long>
{
    Task<PlatformSupportTopic?> GetByIdAsync(long id);
    Task InsertAsync(PlatformSupportTopic topic);
}
