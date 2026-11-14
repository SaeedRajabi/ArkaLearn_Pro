using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.ValueOBJs
{
    /// <summary>
    /// شماره فاکتور (Value Object)
    /// </summary>
    public class InvoiceNumber : BaseValueOBJs<InvoiceNumber>
    {
        public string Value { get; private set; }

        private InvoiceNumber() { }

        public InvoiceNumber(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new InvalidValueObjectStateException("Invoice number cannot be empty.", nameof(InvoiceNumber));

            if (value.Length > 50)
                throw new InvalidValueObjectStateException("Invoice number cannot exceed 50 characters.", nameof(InvoiceNumber));

            Value = value.Trim().ToUpper();
        }

        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Value;
        }

        public override string ToString() => Value;

        public static InvoiceNumber Generate(long orderId, DateTime date)
        {
            // فرمت: INV-YYYYMMDD-ORDERID
            var prefix = "INV";
            var datePart = date.ToString("yyyyMMdd");
            var orderPart = orderId.ToString("D6");
            return new InvoiceNumber($"{prefix}-{datePart}-{orderPart}");
        }
    }
}
