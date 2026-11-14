using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.GetArticleById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.GetArticleBySlug;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.GetAllCommentsByArticleId;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.SearchArticles;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.GetMyFavoriteArticleIds;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.GetMyFavoriteArticles;
using Framework.Src.Core.Contracts.Data.Queries;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.Articles.ArticleRepositoryContracts.Queries
{
    public interface IArticleQueriesRepository : IQueryRepository
    {
        Task<ArticleQri> GetArticleByIdExecuteAsync(GetArticleByIdQuery query);
        Task<ArticleQri?> GetArticleBySlugExecuteAsync(GetArticleBySlugQuery query);
        Task<PagedData<SearchArticleQri>?> SearchArticleExecuteAsync(SearchArticleByInputValueQuery query);
        Task<PagedData<GetAllCommentsByArticleIdQri>> GetAllArticleCommentsByIdAsync(GetAllCommentsByArticleIdQuery query);
        Task<List<long>> GetMyFavoriteArticleIdsAsync(GetMyFavoriteArticleIdsQuery query);
        Task<List<GetMyFavoriteArticleQri>> GetMyFavoriteArticlesAsync(GetMyFavoriteArticlesQuery query);
    }
}
