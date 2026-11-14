using ArkaSoftwarePro.Src.Core.Contracts.PlatformSupportTopics.PlatformSupportTopicRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.PlatformSupportTopics.Queries.GetPlatformSupportTopicById;
using ArkaSoftwarePro.Src.Core.RequestResponse.PlatformSupportTopics.Queries.ListPlatformSupportTopics;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories;

public class PlatformSupportTopicQueryRepository(ArkaSoftwareQueryDbContext dbContext)
    : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext), IPlatformSupportTopicQueryRepository
{
    public async Task<IReadOnlyList<PlatformSupportTopicListItemQri>> ListAllAsync()
        => await dbContext.PlatformSupportTopics.AsNoTracking()
            .Where(x => !x.IsDelete)
            .OrderBy(x => x.SortOrder)
            .ThenByDescending(x => x.Id)
            .Select(x => new PlatformSupportTopicListItemQri
            {
                Id = x.Id,
                Title = x.Title,
                Summary = x.Summary,
                Department = x.Department,
                SortOrder = x.SortOrder,
                IsPublished = x.IsPublished,
                IsAdminTopic = true,
            })
            .ToListAsync();

    public async Task<IReadOnlyList<PlatformSupportTopicListItemQri>> ListPublishedAsync()
        => await dbContext.PlatformSupportTopics.AsNoTracking()
            .Where(x => !x.IsDelete && x.IsPublished)
            .OrderBy(x => x.SortOrder)
            .ThenByDescending(x => x.Id)
            .Select(x => new PlatformSupportTopicListItemQri
            {
                Id = x.Id,
                Title = x.Title,
                Summary = x.Summary,
                Department = x.Department,
                SortOrder = x.SortOrder,
                IsPublished = x.IsPublished,
                IsAdminTopic = true,
            })
            .ToListAsync();

    public async Task<PlatformSupportTopicDetailQri?> GetByIdAsync(long id, bool publishedOnly)
    {
        var query = dbContext.PlatformSupportTopics.AsNoTracking()
            .Where(x => x.Id == id && !x.IsDelete);

        if (publishedOnly)
            query = query.Where(x => x.IsPublished);

        return await query.Select(x => new PlatformSupportTopicDetailQri
        {
            Id = x.Id,
            Title = x.Title,
            Summary = x.Summary,
            ContentHtml = x.ContentHtml,
            Department = x.Department,
            SortOrder = x.SortOrder,
            IsPublished = x.IsPublished,
            IsAdminTopic = true,
        }).FirstOrDefaultAsync();
    }
}
