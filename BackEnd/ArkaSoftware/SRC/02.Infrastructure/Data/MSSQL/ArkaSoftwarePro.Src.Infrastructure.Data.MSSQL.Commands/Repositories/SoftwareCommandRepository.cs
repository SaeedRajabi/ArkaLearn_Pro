using ArkaSoftwarePro.Src.Core.Contracts.Software.SoftwareRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.SoftwareAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Software.Queries.SearchSoftware;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public class SoftwareCommandRepository(ArkaSoftwareCommandDbContext dbContext)
    : BaseCommandRepository<SoftwareProduct, ArkaSoftwareCommandDbContext>(dbContext), ISoftwareCommandRepository
{
    private readonly ArkaSoftwareCommandDbContext _dbContext = dbContext;

    public Task<SoftwareProduct?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default) =>
        _dbContext.Set<SoftwareProduct>()
            .AsNoTracking()
            .Include(s => s.Teacher!)
                .ThenInclude(t => t!.User)
            .Include(s => s.Category)
            .FirstOrDefaultAsync(s => !s.IsDelete && s.Slug == slug, cancellationToken);

    public Task<SoftwareProduct?> GetWithTeacherAsync(long id, CancellationToken cancellationToken = default) =>
        _dbContext.Set<SoftwareProduct>()
            .Include(s => s.Teacher!)
                .ThenInclude(t => t!.User)
            .Include(s => s.Category)
            .FirstOrDefaultAsync(s => !s.IsDelete && s.Id == id, cancellationToken);

    public Task<List<SoftwareProduct>> GetByTeacherIdAsync(long teacherId, CancellationToken cancellationToken = default) =>
        _dbContext.Set<SoftwareProduct>()
            .AsNoTracking()
            .Include(s => s.Category)
            .Where(s => !s.IsDelete && s.TeacherId == teacherId)
            .OrderBy(s => s.SortOrder)
            .ThenByDescending(s => s.Id)
            .ToListAsync(cancellationToken);

    public Task<bool> HasUserLikedAsync(long softwareId, long userId, CancellationToken cancellationToken = default) =>
        _dbContext.Set<SoftwareProductLike>()
            .AnyAsync(l => l.SoftwareProductId == softwareId && l.UserId == userId, cancellationToken);

    public async Task AddLikeAsync(SoftwareProductLike like, CancellationToken cancellationToken = default)
    {
        await _dbContext.Set<SoftwareProductLike>().AddAsync(like, cancellationToken);
    }

    public async Task RemoveLikeAsync(long softwareId, long userId, CancellationToken cancellationToken = default)
    {
        var like = await _dbContext.Set<SoftwareProductLike>()
            .FirstOrDefaultAsync(l => l.SoftwareProductId == softwareId && l.UserId == userId, cancellationToken);
        if (like != null)
            _dbContext.Set<SoftwareProductLike>().Remove(like);
    }

    public async Task<PagedData<SoftwareListItemQri>> SearchPublicAsync(
        SearchSoftwareQuery query,
        long? viewerUserId,
        CancellationToken cancellationToken = default)
    {
        var pageNumber = query.PageNumber < 1 ? 1 : query.PageNumber;
        var pageSize = query.PageSize is < 1 or > 100 ? 24 : query.PageSize;
        var search = query.Search?.Trim();
        var tag = query.Tag?.Trim();
        var categoryId = query.CategoryId is > 0 ? query.CategoryId : null;

        var itemsQuery = _dbContext.Set<SoftwareProduct>()
            .AsNoTracking()
            .Where(s => !s.IsDelete)
            .Include(s => s.Teacher!)
                .ThenInclude(t => t!.User)
            .Include(s => s.Category)
            .AsQueryable();

        if (query.PlatformOnly && query.ForEdit)
        {
            itemsQuery = itemsQuery.Where(s => s.TeacherId == null);
        }
        else if (query.ForEdit && query.TeacherId is > 0)
        {
            itemsQuery = itemsQuery.Where(s => s.TeacherId == query.TeacherId);
        }
        else if (query.TeacherId is > 0)
        {
            itemsQuery = itemsQuery.Where(s =>
                s.TeacherId == query.TeacherId
                && s.ApprovalStatus == TeacherApprovalStatus.Approved
                && s.Teacher != null
                && s.Teacher.AccountStatus == TeacherAccountStatus.Active);
        }
        else
        {
            itemsQuery = itemsQuery.Where(s =>
                (s.TeacherId == null && s.ApprovalStatus == TeacherApprovalStatus.Approved)
                || (s.TeacherId != null
                    && s.ApprovalStatus == TeacherApprovalStatus.Approved
                    && s.Teacher != null
                    && s.Teacher.AccountStatus == TeacherAccountStatus.Active));
        }

        if (categoryId.HasValue)
            itemsQuery = itemsQuery.Where(s => s.CategoryId == categoryId.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            itemsQuery = itemsQuery.Where(s =>
                s.Title.Contains(search)
                || s.Description.Contains(search));
        }

        var all = await itemsQuery
            .OrderByDescending(s => s.DownloadCount)
            .ThenBy(s => s.SortOrder)
            .ThenByDescending(s => s.Id)
            .ToListAsync(cancellationToken);

        if (!string.IsNullOrWhiteSpace(tag))
        {
            all = all
                .Where(s => s.GetTags().Any(t => t.Contains(tag, StringComparison.OrdinalIgnoreCase)))
                .ToList();
        }

        var total = all.Count;
        var page = all.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToList();
        var likedIds = new HashSet<long>();
        if (viewerUserId is > 0 && page.Count > 0)
        {
            var ids = page.Select(s => s.Id).ToList();
            var likes = await _dbContext.Set<SoftwareProductLike>()
                .AsNoTracking()
                .Where(l => l.UserId == viewerUserId && ids.Contains(l.SoftwareProductId))
                .Select(l => l.SoftwareProductId)
                .ToListAsync(cancellationToken);
            likedIds = likes.ToHashSet();
        }

        return new PagedData<SoftwareListItemQri>
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = total,
            QueryResult = page.Select(s => MapListItem(s, likedIds.Contains(s.Id))).ToList(),
        };
    }

    private static SoftwareListItemQri MapListItem(SoftwareProduct s, bool isLiked)
    {
        var user = s.Teacher?.User;
        var displayName = user != null
            ? $"{user.UserFullName?.FirstName} {user.UserFullName?.LastName}".Trim()
            : string.Empty;

        return new SoftwareListItemQri
        {
            Id = s.Id,
            TeacherId = s.TeacherId,
            Title = s.Title,
            ShortDescription = s.Description,
            CoverImageUrl = s.CoverImageUrl,
            CategoryId = s.CategoryId,
            CategoryName = s.Category?.Title?.Value,
            Slug = s.Slug,
            Tags = s.GetTags().ToList(),
            DownloadCount = s.DownloadCount,
            LikeCount = s.LikeCount,
            IsLikedByViewer = isLiked,
            IsPlatformOwned = s.IsPlatformOwned,
            TeacherDisplayName = string.IsNullOrWhiteSpace(displayName) ? user?.UserName?.Value : displayName,
            TeacherUserName = user?.UserName?.Value,
            TeacherAvatarUrl = user?.ProfileImage?.ImageURL,
            ApprovalStatus = MapStatus(s.ApprovalStatus),
        };
    }

    public async Task<List<string>> GetCategoryPathAsync(long? categoryId, CancellationToken cancellationToken = default)
    {
        if (!categoryId.HasValue || categoryId.Value <= 0)
            return [];

        var lookup = await BookCategoryPathHelper.LoadLookupAsync(_dbContext.Categories, cancellationToken);
        return BookCategoryPathHelper.BuildPath(categoryId, lookup);
    }

    private static string MapStatus(TeacherApprovalStatus status) => status switch
    {
        TeacherApprovalStatus.Pending => "pending",
        TeacherApprovalStatus.Approved => "approved",
        TeacherApprovalStatus.Rejected => "rejected",
        _ => "draft",
    };
}
