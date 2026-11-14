using ArkaSoftwarePro.Src.Core.Domain.ProjectAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.Projects.ProjectRepositoryContracts.Commands;

public interface IProjectCommandRepository : ICommandRepository<Project, long>
{
    Task SyncTagsAsync(long projectId, IReadOnlyCollection<string> tagNames);
}
