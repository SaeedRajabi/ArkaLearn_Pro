namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Articles;

public class ArticleReactionQueryModel
{
    public long Id { get; set; }
    public long ArticleId { get; set; }
    public long UserId { get; set; }
    /// <summary>1 = like, -1 = dislike</summary>
    public int Reaction { get; set; }
}
