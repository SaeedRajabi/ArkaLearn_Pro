using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Wallets.Queries.GetAdminUserWallets;

public class GetAdminUserWalletsQuery : IQuery<List<AdminUserWalletQri>>, IWebRequest
{
    public string? Search { get; set; }
    public int Take { get; set; } = 50;
    public string Path => "/api/Service/Wallet/GetAdminUserWallets";
}

public class AdminUserWalletQri
{
    public long UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public long AvailableBalanceToman { get; set; }
    public long ReservedBalanceToman { get; set; }
    public long TotalDepositedToman { get; set; }
    public long TotalSpentToman { get; set; }
    public long TotalReceivedToman { get; set; }
    public bool IsSuspended { get; set; }
    public string? ZibalSubMerchantId { get; set; }
}
