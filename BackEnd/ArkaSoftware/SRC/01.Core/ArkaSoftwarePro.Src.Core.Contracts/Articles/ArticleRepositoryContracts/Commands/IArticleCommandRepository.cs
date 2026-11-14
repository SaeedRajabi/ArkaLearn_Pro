using ArkaSoftwarePro.Src.Core.Domain.ArticleAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.Articles.ArticleRepositoryContracts.Commands
{
    public interface IArticleCommandRepository : ICommandRepository<Article, long>
    {
        Task<Article?> GetWithCommentsAsync(long articleId);
        Task<int> CountByAuthorUserIdAsync(long authorUserId, CancellationToken cancellationToken = default);
        Task<bool> SlugExistsAsync(string slug, long? excludeId = null, CancellationToken cancellationToken = default);
        Task<bool> DeleteCommentAsync(long articleId, long commentId);
        Task SyncTagsAsync(long articleId, IReadOnlyCollection<string> tagNames);
    }
}
