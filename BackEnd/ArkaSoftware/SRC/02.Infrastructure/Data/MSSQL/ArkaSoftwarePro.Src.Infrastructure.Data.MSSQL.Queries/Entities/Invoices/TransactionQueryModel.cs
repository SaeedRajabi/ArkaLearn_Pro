namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Invoices
{
    public class TransactionQueryModel
    {
        public long Id { get; set; }
        public string TransactionNumber { get; set; } = string.Empty;
        public DateTime TransactionDate { get; set; }
        public decimal Amount { get; set; }
        public byte Status { get; set; }
        public string? ReferenceNumber { get; set; }
        public string? Description { get; set; }
        public long? InvoiceId { get; set; }
        public long? PaymentId { get; set; }
    }
}
