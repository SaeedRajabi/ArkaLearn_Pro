using Framework.Src.Core.Domain.Exceptions;

namespace Framework.Src.Core.Domain.ValueOBJs
{
    public class Description : BaseValueOBJs<Description>
    {
        #region Factories
        public static Description FromString(string value) => new Description(value);

        #endregion

        #region Properties
        public string Value { get; private set; }
        #endregion

        #region CTORs
        public Description(string value = "None")
        {
            Validation(value);
            Value = value;
        }
        private Description() { }
        #endregion

        #region Check Validation Method
        private void Validation(string value)
        {
            if (string.IsNullOrEmpty(value))
                Value = ".توضیحات اولیه";

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
        public static explicit operator string(Description title) => title.Value.ToString();
        public static implicit operator Description(string value) => new Description(value);
        #endregion
    }
}
