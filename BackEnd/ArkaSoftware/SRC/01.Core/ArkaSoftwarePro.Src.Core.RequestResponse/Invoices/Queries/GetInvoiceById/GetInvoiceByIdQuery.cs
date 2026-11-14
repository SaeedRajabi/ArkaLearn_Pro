using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Invoices.Queries.GetInvoiceById
{
    /// <summary>
    /// کوئری دریافت فاکتور بر اساس شناسه
    /// </summary>
    public class GetInvoiceByIdQuery : IQuery<GetInvoiceByIdQri>, IWebRequest
    {
        public long InvoiceId { get; set; }
        public string Path => "api/Service/Invoice/GetById";
    }
}
