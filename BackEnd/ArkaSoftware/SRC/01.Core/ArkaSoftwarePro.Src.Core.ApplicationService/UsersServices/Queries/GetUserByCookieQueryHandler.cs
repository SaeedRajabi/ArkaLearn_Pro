using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices;
using ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityCookieContracts;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetUserByCookie;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Queries
{
    public class GetUserByCookieQueryHandler(
        ArkaSoftwareCMPOutServices mafiaOuterService,
        ICookieManager cookieManager,
        IUserQueryRepository userQueryRepository)
        : QueryHandler<GetUserByCookieQuery, GetUserByCookieQri>(mafiaOuterService)
    {
        public override async Task<QueryResult<GetUserByCookieQri>> Handle(GetUserByCookieQuery query)
        {
            try
            {
                if (!cookieManager.IsAuthenticated())
                    return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

                var userResult = await userQueryRepository.ExecuteUserByCookieAsync(query);
                if (userResult == null)
                    return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

                if (UserAccountMessages.IsBlockedStatus(userResult.Status))
                {
                    await cookieManager.LogoutAsync();
                    AddMessage(UserAccountMessages.Blocked);
                    return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);
                }

                return await ResultAsync(userResult, ApplicationServiceStatus.Ok);
            }
            catch
            {
                return await ResultAsync(null!, ApplicationServiceStatus.Exception);
            }
        }
    }
}
