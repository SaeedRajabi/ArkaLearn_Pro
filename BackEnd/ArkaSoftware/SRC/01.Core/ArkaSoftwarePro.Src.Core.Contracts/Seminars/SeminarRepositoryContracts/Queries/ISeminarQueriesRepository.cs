using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.CanUserEnterSeminar;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetAllCommentsBySeminarId;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetAllSeminarRegistrations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetMyRegisteredSeminars;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetSeminarById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetSeminarRegistrations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.SearchSeminars;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.SearchUserSeminars;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetMyFavoriteSeminarIds;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetMyFavoriteSeminars;
using Framework.Src.Core.Contracts.Data.Queries;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.Seminars.SeminarRepositoryContracts.Queries
{
    public interface ISeminarQueriesRepository : IQueryRepository
    {
        Task<SeminarQri> GetSeminarByIdExecuteAsync(GetSeminarByIdQuery query);
        Task<PagedData<SearchSeminarQri>?> SearchSeminarExecuteAsync(SearchSeminarByInputValueQuery query);
        Task<PagedData<SearchSeminarQri>?> SearchUserSeminarsExecuteAsync(SearchUserSeminarsQuery query);
        Task<PagedData<SeminarRegistrationQri>> GetSeminarRegistrationsAsync(GetSeminarRegistrationsQuery query);
        Task<PagedData<SeminarRegistrationWithSeminarQri>> GetAllSeminarRegistrationsAsync(GetAllSeminarRegistrationsQuery query);
        Task<List<MyRegisteredSeminarQri>> GetMyRegisteredSeminarsAsync(GetMyRegisteredSeminarsQuery query);
        Task<PagedData<GetAllCommentsBySeminarIdQri>> GetAllSeminarCommentsByIdAsync(GetAllCommentsBySeminarIdQuery query);
        Task<CanUserEnterSeminarQri> CanUserEnterSeminarAsync(CanUserEnterSeminarQuery query);
        Task<List<long>> GetMyFavoriteSeminarIdsAsync(GetMyFavoriteSeminarIdsQuery query);
        Task<List<GetMyFavoriteSeminarQri>> GetMyFavoriteSeminarsAsync(GetMyFavoriteSeminarsQuery query);
    }
}
