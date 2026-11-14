using System.Net;
using ArkaSoftwarePro.Src.Core.Contracts.Articles.ArticleRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.GetAllCommentsByArticleId;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.GetArticleById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.GetArticleBySlug;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.SearchArticles;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.GetMyFavoriteArticleIds;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.GetMyFavoriteArticles;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Framework.Src.Utilities.OutService.DateTimes;
using Framework.Src.Utilities.OutService.Extensions;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories
{
    public class ArticleQueryRepository(ArkaSoftwareQueryDbContext dbContext)
        : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext), IArticleQueriesRepository
    {
        public async Task<ArticleQri> GetArticleByIdExecuteAsync(GetArticleByIdQuery query)
        {
            var result = await _dbContext.Articles
                .AsNoTracking()
                .Include(x => x.Category)
                .Include(x => x.AuthorUser)
                .Include(x => x.Tags)
                .Where(x => x.Id == query.ArticleId)
                .Select(x => new ArticleQri
                {
                    Id = x.Id,
                    Title = x.Title ?? "",
                    Summary = x.Summary ?? "",
                    Content = x.Content ?? "",
                    Slug = x.Slug ?? "",
                    ThumbnailUrl = x.ThumbnailUrl,
                    SeoTitle = x.SeoTitle,
                    MetaDescription = x.MetaDescription,
                    OgImageUrl = x.OgImageUrl,
                    IsPublished = x.IsPublished,
                    PublishedAt = x.PublishedAt.HasValue ? x.PublishedAt.Value.ToPersianDateTimeString("yyyy/MM/dd - HH:mm") : null,
                    CategoryId = x.CategoryId,
                    CategoryName = x.Category != null ? x.Category.Title : null,
                    AuthorUserId = x.AuthorUserId,
                    AuthorName = x.AuthorUser != null ? $"{x.AuthorUser.FirstName} {x.AuthorUser.LastName}" : null,
                    CreatedAt = x.CreatedDateTime.ToPersianDateTimeString("yyyy/MM/dd - HH:mm"),
                    Tags = x.Tags.Select(t => t.TagName).ToList()
                })
                .FirstOrDefaultAsync();
            return result!;
        }

        public async Task<ArticleQri?> GetArticleBySlugExecuteAsync(GetArticleBySlugQuery query)
        {
            var slug = WebUtility.UrlDecode(query.Slug) ?? query.Slug;
            if (string.IsNullOrWhiteSpace(slug))
                return null;

            var q = _dbContext.Articles
                .AsNoTracking()
                .Include(x => x.Category)
                .Include(x => x.AuthorUser)
                .Include(x => x.Tags)
                .Where(x => x.IsPublished && x.ModerationStatus == (byte)TeacherApprovalStatus.Approved);

            if (long.TryParse(slug, out var id))
                q = q.Where(x => x.Id == id || (x.Slug != null && x.Slug == slug));
            else
                q = q.Where(x => x.Slug != null && x.Slug == slug);

            var result = await q
                .Select(x => new ArticleQri
                {
                    Id = x.Id,
                    Title = x.Title ?? "",
                    Summary = x.Summary ?? "",
                    Content = x.Content ?? "",
                    Slug = x.Slug ?? "",
                    ThumbnailUrl = x.ThumbnailUrl,
                    SeoTitle = x.SeoTitle,
                    MetaDescription = x.MetaDescription,
                    OgImageUrl = x.OgImageUrl,
                    IsPublished = x.IsPublished,
                    PublishedAt = x.PublishedAt.HasValue ? x.PublishedAt.Value.ToPersianDateTimeString("yyyy/MM/dd - HH:mm") : null,
                    CategoryId = x.CategoryId,
                    CategoryName = x.Category != null ? x.Category.Title : null,
                    AuthorUserId = x.AuthorUserId,
                    AuthorName = x.AuthorUser != null ? $"{x.AuthorUser.FirstName} {x.AuthorUser.LastName}" : x.AuthorUser!.UserName,
                    AuthorAvatarImage = x.AuthorUser.ProfileImage!,
                    CreatedAt = x.CreatedDateTime.ToPersianDateTimeString("yyyy/MM/dd - HH:mm"),
                    Tags = x.Tags.Select(t => t.TagName).ToList()
                })
                .FirstOrDefaultAsync();

            return result;
        }

        public async Task<PagedData<SearchArticleQri>?> SearchArticleExecuteAsync(SearchArticleByInputValueQuery query)
        {
            var q = _dbContext.Articles
                .AsNoTracking()
                .Include(x => x.Category)
                .Include(x => x.Tags)
                .Include(x => x.AuthorUser)
                .Where(x => query.PublishedOnly != true || (x.IsPublished && x.ModerationStatus == (byte)TeacherApprovalStatus.Approved));

            if (!string.IsNullOrWhiteSpace(query.InputValue))
                q = q.Where(x => (x.Title != null && x.Title.Contains(query.InputValue)) 
                    || (x.Summary != null && x.Summary.Contains(query.InputValue))
                    || (x.Slug != null && x.Slug == query.InputValue));
            if (query.CategoryId.HasValue)
                q = q.Where(x => x.CategoryId == query.CategoryId);
            if (query.AuthorUserId is > 0)
                q = q.Where(x => x.AuthorUserId == query.AuthorUserId.Value);

            var ordered = q.OrderByDescending(x => x.CreatedDateTime);
            var result = new PagedData<SearchArticleQri?>();
            if (query.NeedTotalCount)
                result.TotalCount = await ordered.CountAsync();

            var list = await ordered
                .Skip(query.SkipCount)
                .Take(query.PageSize)
                .Select(x => new SearchArticleQri
                {
                    Id = x.Id,
                    Title = x.Title ?? "",
                    Summary = x.Summary ?? "",
                    Slug = x.Slug ?? "",
                    ThumbnailUrl = x.ThumbnailUrl,
                    IsPublished = x.IsPublished,
                    PublishedAt = x.PublishedAt.HasValue ? x.PublishedAt.Value.ToPersianDateTimeString("yyyy/MM/dd") : null,
                    CategoryName = x.Category != null ? x.Category.Title : null,
                    CategoryId = x.CategoryId,
                    CreatedAt = x.CreatedDateTime.ToPersianDateTimeString("yyyy/MM/dd"),
                    Tags = x.Tags.Select(t => t.TagName).ToList(),
                    AuthorName = x.AuthorUser != null
                        ? (((x.AuthorUser.FirstName ?? "") + " " + (x.AuthorUser.LastName ?? "")).Trim())
                        : null,
                })
                .ToListAsync();

            var articleIds = list.Select(x => x.Id).ToList();
            if (articleIds.Count > 0)
            {
                Dictionary<long, int> likeCounts = new();
                try
                {
                    likeCounts = await _dbContext.ArticleReactions
                        .AsNoTracking()
                        .Where(r => articleIds.Contains(r.ArticleId) && r.Reaction == 1)
                        .GroupBy(r => r.ArticleId)
                        .Select(g => new { ArticleId = g.Key, Count = g.Count() })
                        .ToDictionaryAsync(x => x.ArticleId, x => x.Count);
                }
                catch
                {
                    // ArticleReactions table may not exist yet on older databases.
                }

                var commentStats = await _dbContext.Articles
                    .AsNoTracking()
                    .Where(a => articleIds.Contains(a.Id))
                    .Select(a => new
                    {
                        a.Id,
                        CommentCount = a.Comments.Count(c => c.IsApproved && c.ParentId == null),
                        AverageRating = a.Comments
                            .Where(c => c.IsApproved && c.Rating > 0)
                            .Select(c => (double?)c.Rating)
                            .Average() ?? 0d,
                    })
                    .ToListAsync();

                var commentById = commentStats.ToDictionary(x => x.Id);

                foreach (var row in list)
                {
                    row.LikeCount = likeCounts.GetValueOrDefault(row.Id);
                    if (commentById.TryGetValue(row.Id, out var stats))
                    {
                        row.CommentCount = stats.CommentCount;
                        row.AverageRating = Math.Round(stats.AverageRating, 1);
                    }
                }
            }

            result.QueryResult = list!;
            return result!;
        }

        public async Task<PagedData<GetAllCommentsByArticleIdQri>> GetAllArticleCommentsByIdAsync(GetAllCommentsByArticleIdQuery query)
        {
            var q = _dbContext.Articles
                .Include(x => x.Comments)
                .ThenInclude(x => x.User)
                .AsNoTracking();

            if (query.ArticleId.HasValue && query.ArticleId.Value > 0)
                q = q.Where(x => x.Id == query.ArticleId.Value);

            var articles = await q.ToListAsync();
            var allComments = articles.SelectMany(a => a.Comments.Select(c => new { Article = a, Comment = c })).ToList();
            if (query.OnlyApproved == true)
                allComments = allComments.Where(x => x.Comment.IsApproved).ToList();

            var items = allComments
                .Select(x => new GetAllCommentsByArticleIdQri
                {
                    Id = x.Comment.Id,
                    ArticleId = x.Article.Id,
                    ArticleTitle = x.Article.Title,
                    Author = x.Comment.User != null ? new CommentAuthorQri
                    {
                        Id = x.Comment.User.Id,
                        AvatarUrl = x.Comment.User.ProfileImage ?? "",
                        FullName = $"{x.Comment.User.FirstName} {x.Comment.User.LastName}",
                        UserName = x.Comment.User.UserName ?? ""
                    } : null,
                    Text = x.Comment.CommentText ?? "",
                    Likes = x.Comment.Likes,
                    ParentId = x.Comment.ParentId,
                    Rating = x.Comment.Rating,
                    IsApproved = x.Comment.IsApproved,
                    TimeStamp = x.Comment.CreateAt.ToPersianDateTimeString("yyyy/MM/dd - HH:mm")
                }).ToList();

            var dict = items.ToDictionary(x => x.Id);
            var roots = new List<GetAllCommentsByArticleIdQri>();
            foreach (var node in items)
            {
                if (node.ParentId == null)
                {
                    roots.Add(node);
                    continue;
                }
                if (dict.TryGetValue(node.ParentId.Value, out var parent))
                    parent.Replies.Add(node);
                else
                    roots.Add(node);
            }
            var rootsOnly = roots.Where(c => c.ParentId == null).ToList();
            var result = new PagedData<GetAllCommentsByArticleIdQri>();
            result.QueryResult = rootsOnly.Skip(query.SkipCount).Take(query.PageSize).ToList();
            result.TotalCount = rootsOnly.Count;
            return result;
        }

        public async Task<List<long>> GetMyFavoriteArticleIdsAsync(GetMyFavoriteArticleIdsQuery query)
        {
            if (query.UserId <= 0)
                return new List<long>();

            return await _dbContext.FavoriteArticles
                .AsNoTracking()
                .Where(x => x.UserId == query.UserId)
                .Select(x => x.ArticleId)
                .ToListAsync();
        }

        public async Task<List<GetMyFavoriteArticleQri>> GetMyFavoriteArticlesAsync(GetMyFavoriteArticlesQuery query)
        {
            if (query.UserId <= 0)
                return new List<GetMyFavoriteArticleQri>();

            var result = await _dbContext.FavoriteArticles
                .AsNoTracking()
                .Where(x => x.UserId == query.UserId)
                .OrderByDescending(x => x.CreatedAt)
                .Select(x => x.Article!)
                .Select(x => new GetMyFavoriteArticleQri
                {
                    Id = x.Id,
                    Title = x.Title ?? "",
                    Summary = x.Summary ?? "",
                    Slug = x.Slug ?? "",
                    ThumbnailUrl = x.ThumbnailUrl,
                    IsPublished = x.IsPublished,
                    PublishedAt = x.PublishedAt.HasValue ? x.PublishedAt.Value.ToPersianDateTimeString("yyyy/MM/dd") : null,
                    CategoryName = x.Category != null ? x.Category.Title : null,
                    CreatedAt = x.CreatedDateTime.ToPersianDateTimeString("yyyy/MM/dd")
                })
                .ToListAsync();

            return result;
        }
    }
}
