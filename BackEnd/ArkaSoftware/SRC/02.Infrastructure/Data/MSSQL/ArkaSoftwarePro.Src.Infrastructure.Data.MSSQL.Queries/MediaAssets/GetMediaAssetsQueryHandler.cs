using ArkaSoftwarePro.Src.Core.RequestResponse.MediaAssets.Queries.GetMediaAssets;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Core.Contracts.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.MediaAssets;

public class GetMediaAssetsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ArkaSoftwareQueryDbContext queryDbContext)
    : IQueryHandler<GetMediaAssetsQuery, PagedMediaAssetsQri>
{
    public async Task<QueryResult<PagedMediaAssetsQri>> Handle(GetMediaAssetsQuery query)
    {
        var page = query.Page <= 0 ? 1 : query.Page;
        var pageSize = query.PageSize <= 0 ? 24 : Math.Min(query.PageSize, 100);
        var skip = (page - 1) * pageSize;

        var includeAll = query.IsAdmin && !query.OwnerUserId.HasValue;
        var ownerFilter = query.IsAdmin ? query.OwnerUserId : query.RequestingUserId;

        var q = queryDbContext.MediaAssets.AsNoTracking().Where(x => !x.IsDelete);

        if (!includeAll && ownerFilter.HasValue)
            q = q.Where(x => x.OwnerUserId == ownerFilter.Value);

        if (query.MediaType.HasValue)
            q = q.Where(x => x.MediaType == query.MediaType.Value);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim();
            q = q.Where(x =>
                (x.OriginalFileName != null && x.OriginalFileName.Contains(term)) ||
                (x.Title != null && x.Title.Contains(term)) ||
                (x.AltText != null && x.AltText.Contains(term)) ||
                (x.Caption != null && x.Caption.Contains(term)));
        }

        var total = await q.CountAsync();
        var items = await q
            .OrderByDescending(x => x.CreatedDateTime ?? DateTime.MinValue)
            .ThenByDescending(x => x.Id)
            .Skip(skip)
            .Take(pageSize)
            .ToListAsync();

        var ownerIds = items.Select(x => x.OwnerUserId).Distinct().ToList();
        var ownerNames = await queryDbContext.Users
            .AsNoTracking()
            .Where(u => ownerIds.Contains(u.Id))
            .Select(u => new { u.Id, Name = u.UserName ?? u.Email })
            .ToDictionaryAsync(x => x.Id, x => x.Name ?? string.Empty);

        var result = new PagedMediaAssetsQri
        {
            Page = page,
            PageSize = pageSize,
            TotalCount = total,
            Items = items.Select(x => new MediaAssetQri
            {
                Id = x.Id,
                OwnerUserId = x.OwnerUserId,
                OwnerName = ownerNames.GetValueOrDefault(x.OwnerUserId),
                FileUrl = x.FileUrl,
                OriginalFileName = x.OriginalFileName,
                MimeType = x.MimeType,
                FileSizeBytes = x.FileSizeBytes,
                MediaType = x.MediaType,
                Title = x.Title,
                AltText = x.AltText,
                Caption = x.Caption,
                Description = x.Description,
                Width = x.Width,
                Height = x.Height,
                ApprovalStatus = x.ApprovalStatus,
                RejectionReason = x.RejectionReason,
                IsRejectionDismissed = x.IsRejectionDismissed,
                CreatedAtUtc = x.CreatedDateTime?.ToString("O") ?? string.Empty,
                UpdatedAtUtc = x.ModifiedDateTime?.ToString("O") ?? string.Empty,
            }).ToList(),
        };

        return new QueryResult<PagedMediaAssetsQri>
        {
            _data = result,
            Status = ApplicationServiceStatus.Ok,
        };
    }
}
