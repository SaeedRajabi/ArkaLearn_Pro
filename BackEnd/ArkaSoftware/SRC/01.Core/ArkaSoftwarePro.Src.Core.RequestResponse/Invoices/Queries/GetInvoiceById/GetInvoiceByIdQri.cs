namespace ArkaSoftwarePro.Src.Core.RequestResponse.Invoices.Queries.GetInvoiceById
{
    /// <summary>
    /// پاسخ کوئری دریافت فاکتور بر اساس شناسه (با جزئیات تراکنش‌ها)
    /// </summary>
    public class GetInvoiceByIdQri
    {
        public long Id { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public string InvoiceDate { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal RemainingAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Description { get; set; }
        public long OrderId { get; set; }
        public string OrderDate { get; set; } = string.Empty;
        public List<InvoiceOrderItemQri> OrderItems { get; set; } = new List<InvoiceOrderItemQri>();
        public List<InvoiceTransactionQri> Transactions { get; set; } = new List<InvoiceTransactionQri>();
    }

    public class InvoiceOrderItemQri
    {
        public long CourseId { get; set; }
        public string CourseTitle { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; }
        public decimal TotalPrice { get; set; }
    }

    public class InvoiceTransactionQri
    {
        public long Id { get; set; }
        public string TransactionNumber { get; set; } = string.Empty;
        public string TransactionDate { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? ReferenceNumber { get; set; }
        public string? Description { get; set; }
    }
}
