using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Queries
{
    public class GetUserByIdQueryHandler : QueryHandler<GetUserByIdQuery, UserQr?>
    {
        private readonly IUserQueryRepository _userQueryRepository;
        public GetUserByIdQueryHandler(ArkaSoftwareCMPOutServices mafiaOuterService, IUserQueryRepository userQueryRepository) : base(mafiaOuterService)
        {
            _userQueryRepository = userQueryRepository;
        }

        public override async Task<QueryResult<UserQr?>> Handle(GetUserByIdQuery query)
        {
            var user = await _userQueryRepository.ExecuteAsync(query);
            return Result(user);
        }
    }
}
