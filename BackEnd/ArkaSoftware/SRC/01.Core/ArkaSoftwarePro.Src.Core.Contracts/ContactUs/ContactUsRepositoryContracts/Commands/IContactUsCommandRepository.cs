using ArkaSoftwarePro.Src.Core.Domain.ContactUsAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.ContactUs.ContactUsRepositoryContracts.Commands
{
    public interface IContactUsCommandRepository : ICommandRepository<ContactUsPage, long>
    {
        Task<ContactUsPage?> GetCurrentPageAsync();
    }
}
