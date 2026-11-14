using ArkaSoftwarePro.Src.Core.Domain.ArticleAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Contracts.Articles.ArticleRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.TagAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TagAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories
{
    public class ArticleCommandRepository(ArkaSoftwareCommandDbContext dbContext)
        : BaseCommandRepository<Article, ArkaSoftwareCommandDbContext>(dbContext), IArticleCommandRepository
    {
        public Task<Article?> GetWithCommentsAsync(long articleId)
        {
            return _dbContext.Articles
                .Include(x => x.ArticleComments)
                .FirstOrDefaultAsync(x => x.Id == articleId);
        }

        public async Task<bool> DeleteCommentAsync(long articleId, long commentId)
        {
            var comments = await _dbContext.Set<ArticleComment>()
                .Where(x => x.ArticleId == articleId)
                .ToListAsync();

            var byParent = comments
                .Where(x => x.ParentId.HasValue)
                .GroupBy(x => x.ParentId!.Value)
                .ToDictionary(x => x.Key, x => x.ToList());

            var idsToDelete = new HashSet<long>();
            var stack = new Stack<long>();
            stack.Push(commentId);

            while (stack.Count > 0)
            {
                var current = stack.Pop();
                if (!idsToDelete.Add(current)) continue;

                if (byParent.TryGetValue(current, out var replies))
                {
                    foreach (var reply in replies)
                        stack.Push(reply.Id);
                }
            }

            var targetComments = comments.Where(x => idsToDelete.Contains(x.Id)).ToList();
            if (targetComments.Count == 0)
                return false;

            _dbContext.Set<ArticleComment>().RemoveRange(targetComments);
            return true;
        }

        public async Task SyncTagsAsync(long articleId, IReadOnlyCollection<string> tagNames)
        {
            var normalizedNames = NormalizeTagNames(tagNames);
            var existingArticleTags = await _dbContext.Tags
                .Where(x => EF.Property<long?>(x, "ArticleId") == articleId)
                .ToListAsync();

            foreach (var tag in existingArticleTags)
                _dbContext.Entry(tag).Property("ArticleId").CurrentValue = null;

            foreach (var name in normalizedNames)
            {
                var tag = await ResolveReusableTagAsync(name, "ArticleId", articleId);
                _dbContext.Entry(tag).Property("ArticleId").CurrentValue = articleId;
            }
        }

        private async Task<Tag> ResolveReusableTagAsync(string tagName, string ownerPropertyName, long ownerId)
        {
            var tags = await _dbContext.Tags.ToListAsync();
            var tag = tags.FirstOrDefault(x =>
                string.Equals(x.TagName.Value, tagName, StringComparison.OrdinalIgnoreCase) &&
                (_dbContext.Entry(x).Property<long?>(ownerPropertyName).CurrentValue == null ||
                 _dbContext.Entry(x).Property<long?>(ownerPropertyName).CurrentValue == ownerId));

            if (tag != null)
                return tag;

            tag = new Tag(new TagName(tagName));
            await _dbContext.Tags.AddAsync(tag);
            return tag;
        }

        private static List<string> NormalizeTagNames(IEnumerable<string?> tagNames)
        {
            return tagNames
                .Select(x => (x ?? string.Empty).Trim().TrimStart('#'))
                .Where(x => x.Length >= 2)
                .Select(x => x.Length > 100 ? x[..100].Trim() : x)
                .Where(x => x.Length >= 2)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
        }

        public Task<int> CountByAuthorUserIdAsync(long authorUserId, CancellationToken cancellationToken = default)
        {
            return _dbContext.Articles
                .AsNoTracking()
                .CountAsync(a => !a.IsDelete && a.AuthorUserId == authorUserId, cancellationToken);
        }

        public async Task<bool> SlugExistsAsync(string slug, long? excludeId = null, CancellationToken cancellationToken = default)
        {
            var normalized = (slug ?? string.Empty).Trim().ToLowerInvariant();
            if (normalized.Length == 0)
                return false;

            var query = _dbContext.Articles.AsNoTracking().Where(a => !a.IsDelete);
            if (excludeId.HasValue)
                query = query.Where(a => a.Id != excludeId.Value);

            var slugs = await query.Select(a => a.Slug!.Value).ToListAsync(cancellationToken);
            return slugs.Any(s => string.Equals(s?.Trim(), normalized, StringComparison.OrdinalIgnoreCase));
        }
    }
}
