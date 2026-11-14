using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.ArticleAggregate.Entities
{
    public class ArticleReaction : Entity
    {
        private ArticleReaction() { }

        public ArticleReaction(long articleId, long userId, int reaction)
        {
            ArticleId = articleId;
            UserId = userId;
            SetReaction(reaction);
        }

        public long ArticleId { get; private set; }
        public long UserId { get; private set; }
        public int Reaction { get; private set; }

        public void SetReaction(int reaction)
        {
            if (reaction is not (1 or -1))
                throw new ArgumentOutOfRangeException(nameof(reaction), "Article reaction must be like (1) or dislike (-1).");

            Reaction = reaction;
        }
    }
}
