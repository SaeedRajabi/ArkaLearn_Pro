using ArkaSoftwarePro.Src.Core.RequestResponse.MediaAssets.Queries.GetMediaAssetOwners;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Core.Contracts.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.MediaAssets;

public class GetMediaAssetOwnersQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ArkaSoftwareQueryDbContext queryDbContext)
    : IQueryHandler<GetMediaAssetOwnersQuery, PagedMediaAssetOwnersQri>
{
    public async Task<QueryResult<PagedMediaAssetOwnersQri>> Handle(GetMediaAssetOwnersQuery query)
    {
        var page = query.Page <= 0 ? 1 : query.Page;
        var pageSize = query.PageSize <= 0 ? 10 : Math.Min(query.PageSize, 50);
        var skip = (page - 1) * pageSize;

        var grouped = queryDbContext.MediaAssets
            .AsNoTracking()
            .Where(x => !x.IsDelete)
            .GroupBy(x => x.OwnerUserId)
            .Select(g => new
            {
                OwnerUserId = g.Key,
                MediaCount = g.Count(),
                LastUploadedAtUtc = g.Max(x => x.CreatedDateTime),
            });

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim();
            var matchingUserIds = await queryDbContext.Users
                .AsNoTracking()
                .Where(u =>
                    (u.UserName != null && u.UserName.Contains(term)) ||
                    (u.Email != null && u.Email.Contains(term)))
                .Select(u => u.Id)
                .ToListAsync();

            grouped = grouped.Where(x => matchingUserIds.Contains(x.OwnerUserId));
        }

        var total = await grouped.CountAsync();
        var pageItems = await grouped
            .OrderByDescending(x => x.LastUploadedAtUtc)
            .Skip(skip)
            .Take(pageSize)
            .ToListAsync();

        var ownerIds = pageItems.Select(x => x.OwnerUserId).ToList();
        var ownerNames = await queryDbContext.Users
            .AsNoTracking()
            .Where(u => ownerIds.Contains(u.Id))
            .Select(u => new { u.Id, Name = u.UserName ?? u.Email })
            .ToDictionaryAsync(x => x.Id, x => x.Name ?? string.Empty);

        var result = new PagedMediaAssetOwnersQri
        {
            Page = page,
            PageSize = pageSize,
            TotalCount = total,
            Items = pageItems.Select(x => new MediaAssetOwnerQri
            {
                OwnerUserId = x.OwnerUserId,
                OwnerName = ownerNames.GetValueOrDefault(x.OwnerUserId),
                MediaCount = x.MediaCount,
                LastUploadedAtUtc = x.LastUploadedAtUtc?.ToString("O") ?? string.Empty,
            }).ToList(),
        };

        return new QueryResult<PagedMediaAssetOwnersQri>
        {
            _data = result,
            Status = ApplicationServiceStatus.Ok,
        };
    }
}
