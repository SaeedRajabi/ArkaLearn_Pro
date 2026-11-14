namespace ArkaSoftwarePro.Src.Core.RequestResponse.Invoices.Queries.GetMyInvoices
{
    /// <summary>
    /// پاسخ کوئری دریافت فاکتورهای کاربر
    /// </summary>
    public class GetMyInvoicesQri
    {
        public long Id { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public string InvoiceDate { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal RemainingAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public long OrderId { get; set; }
        public List<UserInvoiceOrderItems> OrderItems { get; set; } = new List<UserInvoiceOrderItems>();
    }


    public class UserInvoiceOrderItems
    {
        public string CourseTitle { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal TotalPrice { get; set; }
        public decimal UnitPrice { get; set; }
    }
}
