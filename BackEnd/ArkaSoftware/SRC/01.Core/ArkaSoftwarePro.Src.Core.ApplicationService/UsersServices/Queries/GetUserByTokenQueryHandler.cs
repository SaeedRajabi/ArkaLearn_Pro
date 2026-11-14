using ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityTokenContracts;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetUserByToken;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Queries
{
    public class GetUserByTokenQueryHandler : QueryHandler<GetUserByTokenQuery, UserByTokenQri?>
    {
        private readonly IUserQueryRepository _userQueryRepository;
        private readonly IJwtGenerator _jwtGenerator;
        public GetUserByTokenQueryHandler(
                ArkaSoftwareCMPOutServices mafiaOuterService,
                IJwtGenerator jwtGenerator,
                IUserQueryRepository userQueryRepository
            ) : base(mafiaOuterService)
        {
            _userQueryRepository = userQueryRepository;
            _jwtGenerator = jwtGenerator;
        }

        public override async Task<QueryResult<UserByTokenQri?>> Handle(GetUserByTokenQuery query)
        {
            try
            {
                var principal = _jwtGenerator.GetPrincipalFromExpiredToken(query.Token);
                var userName = principal.Claims.FirstOrDefault(x => x.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name")!.Value;
                var result = await _userQueryRepository.ExecuteUserByTokenAsync(userName!);
                return await ResultAsync(result);

            }
            catch
            {
                return await ResultAsync(null);
            }
        }
    }
}
