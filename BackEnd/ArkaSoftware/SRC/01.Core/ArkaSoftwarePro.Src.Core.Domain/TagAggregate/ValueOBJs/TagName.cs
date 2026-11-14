using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.TagAggregate.ValueOBJs
{
    public class TagName : BaseValueOBJs<TagName>
    {
        #region Factories
        public static TagName FromString(string value) => new TagName(value);

        #endregion

        #region Properties
        public string Value { get; private set; }
        #endregion

        #region CTORs
        public TagName(string value)
        {
            Validation(value);
            Value = value;
        }
        private TagName() { }
        #endregion

        #region Check Validation Method
        private void Validation(string value)
        {
            if (string.IsNullOrEmpty(value))
                throw new InvalidValueObjectStateException("ValidationErrorIsRequired", nameof(TagName));
            if (value.Length > 100)
                throw new InvalidValueObjectStateException("ValidationErrorStringLength", nameof(TagName));

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
        public static explicit operator string(TagName title) => title.Value.ToString();
        public static implicit operator TagName(string value) => new TagName(value);
        #endregion
    }
}
