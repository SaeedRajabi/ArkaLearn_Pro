using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetUserByUserNameOrEmail;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Queries
{
    public class GetUserByUserNameOrEmailQueryHandler : QueryHandler<GetUserByUserNameOrEmailQuery, GetUserByUserNameOrEmailQri>
    {
        private readonly IUserQueryRepository _userQueryRepository;
        public GetUserByUserNameOrEmailQueryHandler(ArkaSoftwareCMPOutServices mafiaOuterService , IUserQueryRepository userQueryRepository) : base(mafiaOuterService)
        {
            _userQueryRepository = userQueryRepository;
        }

        public override async Task<QueryResult<GetUserByUserNameOrEmailQri>> Handle(GetUserByUserNameOrEmailQuery query)
        {
            try
            {
                var queryResutl = await _userQueryRepository.ExecuteByUserNameOrEmailAsync(query);
                if (queryResutl != null)
                    return await ResultAsync(queryResutl, Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.Ok);
                return await ResultAsync(null!, Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.NotFound);
            }
            catch
            {
                return await ResultAsync(null!, Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.Exception);
            }
        }
    }
}
