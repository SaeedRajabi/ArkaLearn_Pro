using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.Domain.ValueOBJs;
using System.Text.RegularExpressions;

namespace ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs
{
    public class Email : BaseValueOBJs<Email>
    {
        #region Factories
        public static Email FromString(string value) => new Email(value);

        #endregion

        #region Properties
        public string Value { get; private set; }
        #endregion

        #region CTORs
        public Email(string value)
        {
            Validation(value);
            Value = value;
        }
        private Email() { }
        #endregion

        #region Check Validation Method
        private void Validation(string value)
        {
            string EmailPatternCheck = @"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$";
            Regex regex = new Regex(EmailPatternCheck);
            if (string.IsNullOrEmpty(value))
                throw new InvalidValueObjectStateException("ValidationErrorIsRequired", nameof(Email));
            if (value.Length > 120)
                throw new InvalidValueObjectStateException("ValidationErrorStringLength", nameof(Email));
            if (!regex.IsMatch(value))
                throw new InvalidValueObjectStateException("ValidationErrorIsEnglishCharecterOnly", nameof(Email));
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
        public static explicit operator string(Email title) => title.Value.ToString();
        public static implicit operator Email(string value) => new Email(value);
        #endregion
    }
}
