namespace ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.Enumerations
{
    /// <summary>
    /// وضعیت فاکتور
    /// </summary>
    public enum InvoiceStatus : byte
    {
        DRAFT = 1,      // پیش‌نویس
        ISSUED = 2,     // صادر شده
        PAID = 3,       // پرداخت شده
        CANCELLED = 4   // لغو شده
    }
}
