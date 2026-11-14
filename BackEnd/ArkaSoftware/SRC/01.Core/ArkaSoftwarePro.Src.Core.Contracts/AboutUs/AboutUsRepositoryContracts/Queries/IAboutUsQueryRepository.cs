using ArkaSoftwarePro.Src.Core.RequestResponse.AboutUs.Queries.GetAboutUs;
using Framework.Src.Core.Contracts.Data.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.AboutUs.AboutUsRepositoryContracts.Queries
{
    public interface IAboutUsQueryRepository : IQueryRepository
    {
        Task<AboutUsQri?> GetAboutUsExecuteAsync(GetAboutUsQuery query);
    }
}
