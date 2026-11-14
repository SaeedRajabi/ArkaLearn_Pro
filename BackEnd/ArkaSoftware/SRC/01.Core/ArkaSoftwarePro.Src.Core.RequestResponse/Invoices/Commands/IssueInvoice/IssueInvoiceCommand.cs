using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Invoices.Commands.IssueInvoice
{
    /// <summary>
    /// کامند صادر کردن فاکتور
    /// </summary>
    public class IssueInvoiceCommand : ICommand<string>, IWebRequest
    {
        public long InvoiceId { get; set; }
        public string Path => "api/Service/Invoice/Issue";
    }
}
