using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.Domain.ValueOBJs;
using System.Text.RegularExpressions;

namespace ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs
{
    public class Token : BaseValueOBJs<Token>
    {
        #region Factories
        public static Token Create(string value) => new Token(value);
        #endregion

        #region Properties
        public string Value { get; private set; }
        #endregion

        #region CTORs
        private Token(string value)
        {
            Validation(value);
            Value = value;
        }
        private Token() { }
        #endregion

        #region Check Validation Method
        private void Validation(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new InvalidValueObjectStateException("Token cannot be empty.", nameof(Token));
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
        public static explicit operator string(Token title) => title.ToString();
        public static implicit operator Token(string value) => Create(value);
        #endregion
    }
}
