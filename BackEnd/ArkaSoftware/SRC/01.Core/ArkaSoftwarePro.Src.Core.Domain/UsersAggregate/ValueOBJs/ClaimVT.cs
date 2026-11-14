using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs
{
    public class ClaimVT : BaseValueOBJs<ClaimVT>
    {
        #region Factories
        public static ClaimVT Create(string value) => new ClaimVT(value);
        #endregion

        #region Properties
        public string Value { get; private set; }
        #endregion

        #region CTORs
        public ClaimVT(string value)
        {
            Validation(value);
            Value = value;
        }
        private ClaimVT() { }
        #endregion

        #region Check Validation Method
        private void Validation(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new InvalidValueObjectStateException("Claim Type cannot be empty.", nameof(ClaimVT));
        }
        #endregion

        #region Class Methods Override 
        public override string ToString() => Value;
        #endregion

        #region Override Methods In Parent Class
        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Value;
        }
        #endregion

        #region Casting Excplicit And Implicit Operator Override
        public static explicit operator string(ClaimVT title) => title.ToString();
        public static implicit operator ClaimVT(string value) => Create(value);
        #endregion
    }
}




