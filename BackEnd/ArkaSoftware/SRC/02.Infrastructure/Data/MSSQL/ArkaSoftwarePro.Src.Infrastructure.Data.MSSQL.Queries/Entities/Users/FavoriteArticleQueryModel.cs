using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Articles;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Users
{
    public class FavoriteArticleQueryModel
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public long ArticleId { get; set; }
        public DateTime CreatedAt { get; set; }

        public ArticleQueryModel? Article { get; set; }
    }
}
