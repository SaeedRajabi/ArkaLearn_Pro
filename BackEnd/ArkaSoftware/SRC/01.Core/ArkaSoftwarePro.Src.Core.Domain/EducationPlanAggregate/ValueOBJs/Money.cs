using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.EducationPlanAggregate.ValueOBJs
{
    public class Money : BaseValueOBJs<Money>
    {
        #region Properties
        public decimal Amount { get; private set; }
        public string Currency { get; private set; } = "IRR"; // پیش‌فرض ریال ایران
        #endregion

        #region CTORs
        public Money(decimal amount)
        {
            if (amount < 0)
                throw new InvalidValueObjectStateException("ValidationErrorNegativeMoneyValue", nameof(Amount));

            Amount = amount;
        }
        private Money() { }
        #endregion

        #region Override Methods
        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Amount;
            yield return Currency;
        }

        public override string ToString() => $"{Amount} {Currency}";
        #endregion

        #region Operators
        public static Money operator +(Money a, Money b) => new Money(a.Amount + b.Amount);
        public static Money operator -(Money a, Money b) => new Money(a.Amount - b.Amount);
        public static bool operator <(Money a, Money b) => a.Amount < b.Amount;
        public static bool operator >(Money a, Money b) => a.Amount > b.Amount;
        #endregion
    }

}
