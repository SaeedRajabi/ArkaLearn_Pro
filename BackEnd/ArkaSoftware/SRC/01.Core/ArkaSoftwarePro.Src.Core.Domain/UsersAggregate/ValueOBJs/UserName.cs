using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.Domain.ValueOBJs;
using System.Text.RegularExpressions;

namespace ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs
{
    public class UserName : BaseValueOBJs<UserName>
    {
        #region Factories
        public static UserName FromString(string value) => new UserName(value);

        #endregion

        #region Properties
        public string Value { get; private set; }
        #endregion

        #region CTORs
        public UserName(string value)
        {
            Validation(value);
            Value = value;
        }
        private UserName() { }
        #endregion

        #region Check Validation Method
        private void Validation(string value)
        {

            if (string.IsNullOrEmpty(value))
                throw new InvalidValueObjectStateException("ValidationErrorIsRequired", nameof(UserName));
            if (value.Length < 2 || value.Length > 120)
                throw new InvalidValueObjectStateException("ValidationErrorStringLength", nameof(UserName));
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
        public static explicit operator string(UserName title) => title.Value.ToString();
        public static implicit operator UserName(string value) => new UserName(value);
        #endregion
    }
}
