using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.SearchUsersByInputValue;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Queries
{
    public class SearchUserByInputValueQueryHandler : QueryHandler<SearchUsersByInputValueQuery, PagedData<SearchUsersByInputValueQri>>
    {
        private readonly IUserQueryRepository _userQueryRepository;
        public SearchUserByInputValueQueryHandler(ArkaSoftwareCMPOutServices mafiaOuterService , 
            IUserQueryRepository userQueryRepository) : base(mafiaOuterService)
        {
            _userQueryRepository = userQueryRepository;
        }

        public override async Task<QueryResult<PagedData<SearchUsersByInputValueQri>>> Handle(SearchUsersByInputValueQuery query)
        {
            try
            {
                var result = await _userQueryRepository.SearchUsersExecuteAsync(query);
                if (result is null)
                    return await ResultAsync(null!, Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.NotFound);
                return await ResultAsync(result, Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.Ok);
            }
            catch
            {
                return await ResultAsync(null!, Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.Exception);

            }
        }
    }
}
