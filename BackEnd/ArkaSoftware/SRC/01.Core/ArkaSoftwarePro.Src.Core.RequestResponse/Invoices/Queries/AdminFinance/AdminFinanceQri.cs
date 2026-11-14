namespace ArkaSoftwarePro.Src.Core.RequestResponse.Invoices.Queries.AdminFinance
{
    public class AdminInvoiceQri
    {
        public long Id { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public string InvoiceDate { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal RemainingAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public long OrderId { get; set; }
        public long StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string StudentEmail { get; set; } = string.Empty;
        public int TransactionCount { get; set; }
    }

    public class AdminPaymentQri
    {
        public long Id { get; set; }
        public long? InvoiceId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public string TransactionNumber { get; set; } = string.Empty;
        public string TransactionDate { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? ReferenceNumber { get; set; }
        public string? Description { get; set; }
        public long? PaymentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string StudentEmail { get; set; } = string.Empty;
    }
}
