using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Invoices.Commands.CancelInvoice
{
    /// <summary>
    /// کامند لغو فاکتور
    /// </summary>
    public class CancelInvoiceCommand : ICommand<string>, IWebRequest
    {
        public long InvoiceId { get; set; }
        public string? Reason { get; set; }
        public string Path => "api/Service/Invoice/Cancel";
    }
}
