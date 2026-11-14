using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Wallets.Commands.AdminAdjustUserWallet;

public class AdminAdjustUserWalletCommand : ICommand<string>, IWebRequest
{
    public long UserId { get; set; }
    public long AmountToman { get; set; }
    public string? Note { get; set; }
    public string Path => "/api/Service/Wallet/AdminAdjustBalance";
}
