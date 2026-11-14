using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.ValueOBJs
{
    public class Title : BaseValueOBJs<Title>
    {
        #region Factories
        public static Title FromString(string value) => new Title(value);

        #endregion

        #region Properties
        public string? Value { get; private set; }
        #endregion

        #region CTORs
        public Title(string value)
        {
            Validation(value);
            Value = value;
        }
        private Title() { }
        #endregion

        #region Check Validation Method
        private void Validation(string value)
        {
            if (string.IsNullOrEmpty(value))
                throw new InvalidValueObjectStateException("ValidationErrorIsRequired", nameof(Title));
            if (value.Length > 100)
                throw new InvalidValueObjectStateException("ValidationErrorStringLength", nameof(Title));

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
        public static explicit operator string(Title title) => title.Value!.ToString();
        public static implicit operator Title(string value) => new Title(value);
        #endregion
    }
}
