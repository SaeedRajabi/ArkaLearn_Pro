using System.Windows.Input;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Invoices.Commands.InvoicePaid;

public class InvoicePaidCommand:ICommand<string> , IWebRequest
{
    
    public string Path => "";
}