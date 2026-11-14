using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Invoices.Commands.AddTransaction
{
    /// <summary>
    /// کامند افزودن تراکنش به فاکتور
    /// </summary>
    public class AddTransactionCommand : ICommand<string>, IWebRequest
    {
        public long InvoiceId { get; set; }
        public decimal Amount { get; set; }
        public string? ReferenceNumber { get; set; }
        public string? Description { get; set; }
        public long? PaymentId { get; set; } // اگر از طریق Enrollment پرداخت شده باشد
        public string Path => "api/Service/Invoice/AddTransaction";
    }
}
