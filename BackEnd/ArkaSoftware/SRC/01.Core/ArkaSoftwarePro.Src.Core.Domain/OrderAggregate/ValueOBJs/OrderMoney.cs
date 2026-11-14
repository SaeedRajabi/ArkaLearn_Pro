using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.OrderAggregate.ValueOBJs
{
    public class OrderMoney : BaseValueOBJs<OrderMoney>
    {
        #region Properties
        public decimal Amount { get; private set; }
        public string Currency { get; private set; } = "IRR"; // پیش‌فرض ریال ایران
        #endregion

        #region CTORs
        public OrderMoney(decimal amount)
        {
            if (amount < 0)
                throw new InvalidValueObjectStateException("ValidationErrorNegativeMoneyValue", nameof(Amount));

            Amount = amount;
            Currency = "IRR";
        }
        private OrderMoney() { }
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
        public static OrderMoney operator +(OrderMoney a, OrderMoney b) => new OrderMoney(a.Amount + b.Amount);
        public static OrderMoney operator -(OrderMoney a, OrderMoney b) => new OrderMoney(a.Amount - b.Amount);
        public static bool operator <(OrderMoney a, OrderMoney b) => a.Amount < b.Amount;
        public static bool operator >(OrderMoney a, OrderMoney b) => a.Amount > b.Amount;
        #endregion
    }

}
