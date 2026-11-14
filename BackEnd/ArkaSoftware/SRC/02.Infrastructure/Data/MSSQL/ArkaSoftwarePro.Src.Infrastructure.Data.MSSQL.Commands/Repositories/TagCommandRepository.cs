using ArkaSoftwarePro.Src.Core.Contracts.Tags.TagRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.TagAggregate.Entities;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories
{
    public class TagCommandRepository : BaseCommandRepository<Tag, ArkaSoftwareCommandDbContext>, ITagCommandRepository
    {
        public TagCommandRepository(ArkaSoftwareCommandDbContext dbContext) : base(dbContext)
        {
        }
    }
}
