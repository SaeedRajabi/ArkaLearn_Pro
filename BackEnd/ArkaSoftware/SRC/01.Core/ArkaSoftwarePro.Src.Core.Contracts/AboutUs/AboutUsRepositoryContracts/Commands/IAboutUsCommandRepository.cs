using ArkaSoftwarePro.Src.Core.Domain.AboutUsAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.AboutUs.AboutUsRepositoryContracts.Commands
{
    public interface IAboutUsCommandRepository : ICommandRepository<AboutUsPage, long>
    {
        Task<AboutUsPage?> GetCurrentPageAsync();
    }
}
