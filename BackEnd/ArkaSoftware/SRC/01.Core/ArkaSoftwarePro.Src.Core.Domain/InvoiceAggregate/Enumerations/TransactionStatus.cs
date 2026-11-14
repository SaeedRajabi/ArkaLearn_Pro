namespace ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.Enumerations
{
    /// <summary>
    /// وضعیت تراکنش
    /// </summary>
    public enum TransactionStatus : byte
    {
        PENDING = 1,    // در انتظار
        SUCCESS = 2,    // موفق
        FAILED = 3,     // ناموفق
        REFUNDED = 4    // بازگشت وجه
    }
}
