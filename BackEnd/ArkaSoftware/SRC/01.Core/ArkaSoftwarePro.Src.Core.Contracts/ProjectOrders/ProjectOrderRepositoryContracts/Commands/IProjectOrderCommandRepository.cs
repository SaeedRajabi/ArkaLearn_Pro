using ArkaSoftwarePro.Src.Core.Domain.ProjectOrderAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.ProjectOrders.ProjectOrderRepositoryContracts.Commands;

public interface IProjectOrderCommandRepository : ICommandRepository<ProjectOrder, long>
{
    Task<int> GetNextRequestNumberAsync();
    Task<List<long>> GetAdminUserIdsAsync();
}
