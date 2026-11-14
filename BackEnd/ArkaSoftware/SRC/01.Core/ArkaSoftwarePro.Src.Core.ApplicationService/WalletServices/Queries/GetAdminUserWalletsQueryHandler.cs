using ArkaSoftwarePro.Src.Core.Contracts.Finance.WalletRepositoryContracts;
using ArkaSoftwarePro.Src.Core.RequestResponse.Wallets.Queries.GetAdminUserWallets;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.WalletServices.Queries;

public class GetAdminUserWalletsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IUserWalletRepository walletRepository)
    : QueryHandler<GetAdminUserWalletsQuery, List<AdminUserWalletQri>>(outer)
{
    public override async Task<QueryResult<List<AdminUserWalletQri>>> Handle(GetAdminUserWalletsQuery query)
    {
        var rows = await walletRepository.SearchWalletsForAdminAsync(query.Search, query.Take);
        return await ResultAsync(rows);
    }
}
