using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.ValueOBJs
{
    /// <summary>
    /// شماره تراکنش (Value Object)
    /// </summary>
    public class TransactionNumber : BaseValueOBJs<TransactionNumber>
    {
        public string Value { get; private set; }

        private TransactionNumber() { }

        public TransactionNumber(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new InvalidValueObjectStateException("Transaction number cannot be empty.", nameof(TransactionNumber));

            if (value.Length > 100)
                throw new InvalidValueObjectStateException("Transaction number cannot exceed 100 characters.", nameof(TransactionNumber));

            Value = value.Trim();
        }

        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Value;
        }

        public override string ToString() => Value;

        public static TransactionNumber Generate(long invoiceId, DateTime date)
        {
            // فرمت: TRX-YYYYMMDD-INVOICEID-TIMESTAMP
            var prefix = "TRX";
            var datePart = date.ToString("yyyyMMdd");
            var invoicePart = invoiceId.ToString("D6");
            var timePart = date.ToString("HHmmss");
            return new TransactionNumber($"{prefix}-{datePart}-{invoicePart}-{timePart}");
        }
    }
}
