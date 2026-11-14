using ArkaSoftwarePro.Src.Core.RequestResponse.ContactUs.Queries.GetContactUs;
using Framework.Src.Core.Contracts.Data.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.ContactUs.ContactUsRepositoryContracts.Queries
{
    public interface IContactUsQueryRepository : IQueryRepository
    {
        Task<ContactUsQri?> GetContactUsExecuteAsync(GetContactUsQuery query);
    }
}
