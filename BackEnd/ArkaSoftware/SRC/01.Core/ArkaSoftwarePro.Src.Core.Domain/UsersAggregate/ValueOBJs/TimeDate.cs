using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs
{
    public class TimeDate : BaseValueOBJs<TimeDate>
    {
        #region Factories
        public static TimeDate Create(DateTime createdAt) => new TimeDate(createdAt, null);
        public static TimeDate Create(string createdAt, string expirationDate)
            => new TimeDate(DateTime.Parse(createdAt), DateTime.Parse(expirationDate));
        #endregion

        #region Properties
        public DateTime CreatedAt { get; private set; }
        public DateTime? ExpirationDate { get; private set; }
        #endregion

        #region CTORs
        private TimeDate(DateTime createdAt, DateTime? expirationDate)
        {
            if (expirationDate.HasValue && expirationDate.Value <= createdAt)
                throw new InvalidValueObjectStateException("Expiration date must be after the creation date.", nameof(expirationDate));
            CreatedAt = createdAt;
            ExpirationDate = expirationDate;
        }
        private TimeDate() { }
        #endregion

        #region Class Methods Override 
        public override string ToString() => $"CreatedAt: {CreatedAt}, ExpirationDate: {(ExpirationDate.HasValue ? ExpirationDate.Value.ToString() : "None")}";
        #endregion

        #region Override Methods In Parent Class
        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return new { CreatedAt, ExpirationDate };
        }
        #endregion

        #region Casting Excplicit And Implicit Operator Override
        public static explicit operator string(TimeDate title) => title.ToString();
        public static implicit operator TimeDate((DateTime createdAt, DateTime expirationDate) value) => new TimeDate(value.createdAt, value.expirationDate);
        #endregion

        #region Behaviors IMP
        public bool IsExpired() => ExpirationDate.HasValue && ExpirationDate.Value <= DateTime.UtcNow;
        #endregion
    }
}
