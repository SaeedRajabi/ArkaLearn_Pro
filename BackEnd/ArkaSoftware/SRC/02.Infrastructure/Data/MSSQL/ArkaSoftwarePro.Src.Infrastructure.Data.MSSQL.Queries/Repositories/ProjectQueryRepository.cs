using System.Net;
using ArkaSoftwarePro.Src.Core.Contracts.Projects.ProjectRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using ArkaSoftwarePro.Src.Core.RequestResponse.Projects.Queries.GetProjectById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Projects.Queries.GetProjectBySlug;
using ArkaSoftwarePro.Src.Core.RequestResponse.Projects.Queries.SearchProjects;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Framework.Src.Utilities.OutService.DateTimes;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories;

public class ProjectQueryRepository(ArkaSoftwareQueryDbContext dbContext)
    : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext), IProjectQueriesRepository
{
    public async Task<ProjectQri?> GetProjectByIdExecuteAsync(GetProjectByIdQuery query)
    {
        var row = await _dbContext.Projects
            .AsNoTracking()
            .Include(x => x.AuthorUser)
            .Include(x => x.Tags)
            .FirstOrDefaultAsync(x => x.Id == query.ProjectId);

        return row == null ? null : MapToProjectQri(row);
    }

    public async Task<ProjectQri?> GetProjectBySlugExecuteAsync(GetProjectBySlugQuery query)
    {
        var slug = WebUtility.UrlDecode(query.Slug) ?? query.Slug;
        if (string.IsNullOrWhiteSpace(slug))
            return null;

        var q = _dbContext.Projects
            .AsNoTracking()
            .Include(x => x.AuthorUser)
            .Include(x => x.Tags)
            .Where(x => x.IsPublished);

        if (long.TryParse(slug, out var id))
            q = q.Where(x => x.Id == id || (x.Slug != null && x.Slug == slug));
        else
            q = q.Where(x => x.Slug != null && x.Slug == slug);

        var row = await q.FirstOrDefaultAsync();
        return row == null ? null : MapToProjectQri(row);
    }

    public async Task<PagedData<SearchProjectQri>?> SearchProjectExecuteAsync(SearchProjectByInputValueQuery query)
    {
        var q = _dbContext.Projects
            .AsNoTracking()
            .Include(x => x.Tags)
            .Where(x => query.PublishedOnly != true || x.IsPublished);

        if (!string.IsNullOrWhiteSpace(query.InputValue))
        {
            q = q.Where(x =>
                (x.Title != null && x.Title.Contains(query.InputValue)) ||
                (x.ShortDescription != null && x.ShortDescription.Contains(query.InputValue)) ||
                (x.Slug != null && x.Slug.Contains(query.InputValue)) ||
                (x.TechnologiesJson != null && x.TechnologiesJson.Contains(query.InputValue)) ||
                x.Tags.Any(t => t.TagName.Contains(query.InputValue)));
        }

        if (!string.IsNullOrWhiteSpace(query.Tag))
        {
            var tag = query.Tag.Trim();
            q = q.Where(x => x.Tags.Any(t => t.TagName.Contains(tag)));
        }

        if (!string.IsNullOrWhiteSpace(query.Technology))
        {
            var tech = query.Technology.Trim();
            q = q.Where(x => x.TechnologiesJson != null && x.TechnologiesJson.Contains(tech));
        }

        var ordered = q.OrderByDescending(x => x.CreatedDateTime);
        var result = new PagedData<SearchProjectQri?>();
        if (query.NeedTotalCount)
            result.TotalCount = await ordered.CountAsync();

        var rows = await ordered
            .Skip(query.SkipCount)
            .Take(query.PageSize)
            .ToListAsync();

        var list = rows.Select(x => new SearchProjectQri
        {
            Id = x.Id,
            Title = x.Title ?? "",
            Slug = x.Slug ?? "",
            ShortDescription = x.ShortDescription ?? "",
            ThumbnailUrl = x.ThumbnailUrl,
            IsPublished = x.IsPublished,
            PublishedAt = x.PublishedAt.HasValue
                ? x.PublishedAt.Value.ToPersianDateTimeString("yyyy/MM/dd - HH:mm")
                : null,
            CreatedAt = x.CreatedDateTime.ToPersianDateTimeString("yyyy/MM/dd - HH:mm"),
            Tags = x.Tags.Select(t => t.TagName).ToList(),
            Technologies = ProjectReadHelper.ParseStringList(x.TechnologiesJson)
        }).ToList();

        result.QueryResult = list;
        return result;
    }

    private static ProjectQri MapToProjectQri(Entities.Projects.ProjectQueryModel row) =>
        new()
        {
            Id = row.Id,
            Title = row.Title ?? "",
            Slug = row.Slug ?? "",
            ShortDescription = row.ShortDescription ?? "",
            LongDescription = row.LongDescription ?? "",
            ThumbnailUrl = row.ThumbnailUrl,
            SeoTitle = row.SeoTitle,
            MetaDescription = row.MetaDescription,
            OgImageUrl = row.OgImageUrl,
            IntroVideoUrl = row.IntroVideoUrl,
            GitHubUrl = row.GitHubUrl,
            ProjectUrl = row.ProjectUrl,
            Technologies = ProjectReadHelper.ParseStringList(row.TechnologiesJson),
            Gallery = ProjectReadHelper.ParseGallery(row.GalleryJson),
            IsPublished = row.IsPublished,
            PublishedAt = row.PublishedAt.HasValue
                ? row.PublishedAt.Value.ToPersianDateTimeString("yyyy/MM/dd - HH:mm")
                : null,
            AuthorUserId = row.AuthorUserId,
            AuthorName = row.AuthorUser != null
                ? $"{row.AuthorUser.FirstName} {row.AuthorUser.LastName}"
                : null,
            CreatedAt = row.CreatedDateTime.ToPersianDateTimeString("yyyy/MM/dd - HH:mm"),
            Tags = row.Tags.Select(t => t.TagName).ToList()
        };
}
