using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities
{
    public class FavoriteArticle : AggregateRoot
    {
        public long UserId { get; private set; }
        public long ArticleId { get; private set; }
        public DateTime CreatedAt { get; private set; }

        public FavoriteArticle(long userId, long articleId)
        {
            UserId = userId;
            ArticleId = articleId;
            CreatedAt = DateTime.UtcNow;
        }

        public FavoriteArticle()
        {
        }
    }
}
