using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Wallets.Commands.PayInvoiceFromWallet;

public class PayInvoiceFromWalletCommand : ICommand<string>, IWebRequest
{
    public long InvoiceId { get; set; }
    public string Path => "/api/Service/Wallet/PayInvoice";
}
