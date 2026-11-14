using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Invoices.Queries.GetMyInvoices
{
    /// <summary>
    /// کوئری دریافت فاکتورهای کاربر
    /// </summary>
    public class GetMyInvoicesQuery : IQuery<List<GetMyInvoicesQri>>, IWebRequest
    {
        public long UserId { get; set; }
        public string Path => "api/Service/Invoice/GetMyInvoices";
    }
}
