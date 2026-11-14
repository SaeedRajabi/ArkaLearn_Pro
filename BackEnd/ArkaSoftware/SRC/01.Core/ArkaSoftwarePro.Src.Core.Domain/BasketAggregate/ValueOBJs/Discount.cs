using ArkaSoftwarePro.Src.Core.Domain.BasketAggregate.Enumerations;
using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.BasketAggregate.ValueOBJs
{
    public class Discount:BaseValueOBJs<Discount>
    {

        #region Factories
        public static Discount FromString(string value) => new Discount(Convert.ToDecimal(value),DiscountType.FIXED);
        public static Discount FromDecimal(decimal value) => new Discount(Convert.ToDecimal(value), DiscountType.FIXED);
        public static Discount FromDouble(double value) => new Discount(Convert.ToDecimal(value), DiscountType.FIXED);


        #endregion

        #region Properties
        public decimal Amount { get; private set; }
        public DiscountType Type { get; private set; }
        public string? Code { get; private set; }
        #endregion

        #region CTOR
        private Discount(decimal amount, DiscountType type, string code = "")
        {
            if (amount < 0)
                throw new InvalidValueObjectStateException("Amount cannot be negative", nameof(amount));
            var normalized = (code ?? string.Empty).Trim().ToUpperInvariant();
            if (string.IsNullOrEmpty(normalized) || normalized.Length < 4 || normalized.Length > 32)
                throw new InvalidValueObjectStateException("Discount Code Is Not Valid", nameof(code));
            Code = normalized;
            Amount = amount;
            Type = type;
        }

        public Discount()
        {
        }
        #endregion

        #region Implementation Behavior Rich 
        public Discount Add(Discount other) => new Discount(Amount + other.Amount, DiscountType.FIXED, Code ?? "FIXEDSUM01");
        public Discount Subtract(Discount other) => new Discount(Amount - other.Amount, DiscountType.FIXED, Code ?? "FIXEDSUB01");

        public static Discount Create(decimal amount)
        {
            if (amount <= 0)
                throw new ArgumentException("Amount must be greater than zero for fixed discount.");
            return new Discount(amount, DiscountType.FIXED, "FIXEDCODE1");
        }

        public static Discount Create(decimal amount, DiscountType type, string code)
        {
            if (amount <= 0)
                throw new ArgumentException("Amount must be greater than zero.");
            if (type == DiscountType.PERCENTAGE && amount > 100)
                throw new ArgumentException("Percentage discount cannot exceed 100.");
            return new Discount(amount, type, code);
        }

        // رفتارها
        public decimal ApplyDiscount(decimal price)
        {
            return Type switch
            {
                DiscountType.FIXED => price - Amount,
                DiscountType.PERCENTAGE => price - price * Amount / 100,
                _ => price,
            };
        }


        #endregion

        #region Override Methods In Parent Class
        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Amount;
        }
        #endregion

        #region Class Methods Override 
        public override string ToString() => $"{Amount:N0}";


        #endregion

    }
}
