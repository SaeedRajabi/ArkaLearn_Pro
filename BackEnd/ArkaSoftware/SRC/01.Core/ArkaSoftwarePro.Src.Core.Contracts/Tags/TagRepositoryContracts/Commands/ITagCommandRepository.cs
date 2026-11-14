using ArkaSoftwarePro.Src.Core.Domain.TagAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.Tags.TagRepositoryContracts.Commands
{
    public interface ITagCommandRepository : ICommandRepository<Tag, long>
    {
    }
}
