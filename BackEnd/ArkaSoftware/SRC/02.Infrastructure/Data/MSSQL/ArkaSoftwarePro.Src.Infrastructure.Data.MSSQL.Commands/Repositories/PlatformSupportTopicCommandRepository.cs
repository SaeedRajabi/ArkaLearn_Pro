using ArkaSoftwarePro.Src.Core.Contracts.PlatformSupportTopics.PlatformSupportTopicRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.PlatformSupportTopicAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public class PlatformSupportTopicCommandRepository(ArkaSoftwareCommandDbContext dbContext)
    : BaseCommandRepository<PlatformSupportTopic, ArkaSoftwareCommandDbContext>(dbContext), IPlatformSupportTopicCommandRepository
{
    public async Task<PlatformSupportTopic?> GetByIdAsync(long id)
        => await _dbContext.PlatformSupportTopics
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDelete);

    public async Task InsertAsync(PlatformSupportTopic topic)
        => await _dbContext.PlatformSupportTopics.AddAsync(topic);
}
