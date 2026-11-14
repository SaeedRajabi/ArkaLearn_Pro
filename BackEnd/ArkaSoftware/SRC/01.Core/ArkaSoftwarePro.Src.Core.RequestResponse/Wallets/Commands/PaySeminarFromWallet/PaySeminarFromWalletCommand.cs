using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Wallets.Commands.PaySeminarFromWallet;

public class PaySeminarFromWalletCommand : ICommand<string>, IWebRequest
{
    public long SeminarId { get; set; }
    public string Path => "/api/Service/Wallet/PaySeminar";
}
