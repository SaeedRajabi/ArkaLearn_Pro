using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Invoices.Commands.CreateInvoice
{
    /// <summary>
    /// کامند ایجاد فاکتور از سفارش
    /// </summary>
    public class CreateInvoiceCommand : ICommand<string>, IWebRequest
    {
        public long OrderId { get; set; }
        public long StudentId { get; set; }
        public string? Description { get; set; }
        public string Path => "api/Service/Invoice/Create";
    }
}
