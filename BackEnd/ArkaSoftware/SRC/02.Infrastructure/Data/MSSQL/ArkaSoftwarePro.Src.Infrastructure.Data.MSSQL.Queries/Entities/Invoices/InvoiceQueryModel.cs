namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Invoices
{
    public class InvoiceQueryModel
    {
        public long Id { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public DateTime InvoiceDate { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public byte Status { get; set; }
        public string? Description { get; set; }
        public long OrderId { get; set; }
        public long StudentId { get; set; }

        public List<TransactionQueryModel> Transactions { get; set; } = new();
    }
}
