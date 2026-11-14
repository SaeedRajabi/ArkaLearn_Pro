using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Wallets.Queries.GetMyWallet;

public class GetMyWalletQuery : IQuery<MyWalletQri>, IWebRequest
{
    public string Path => "/api/Service/Wallet/GetMyWallet";
}

public class MyWalletQri
{
    public long UserId { get; set; }
    public long AvailableBalanceToman { get; set; }
    public long ReservedBalanceToman { get; set; }
    public long TotalDepositedToman { get; set; }
    public long TotalSpentToman { get; set; }
    public long TotalReceivedToman { get; set; }
    public long TotalWithdrawnToman { get; set; }
    public bool IsSuspended { get; set; }
    public bool HasZibalSubMerchant { get; set; }
    public bool ProfileCompleteForWallet { get; set; }
    public string? ProfileCompletionHint { get; set; }
}
