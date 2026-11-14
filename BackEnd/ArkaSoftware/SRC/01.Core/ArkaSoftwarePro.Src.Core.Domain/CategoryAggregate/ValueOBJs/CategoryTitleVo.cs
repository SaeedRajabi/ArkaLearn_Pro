using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.CategoryAggregate.ValueOBJs
{
    public class CategoryTitleVo:BaseValueOBJs<CategoryTitleVo>
    {
        #region Factories
        public static CategoryTitleVo FromString(string value) => new CategoryTitleVo(value);

        #endregion

        #region Properties
        public string? Value { get; private set; }
        #endregion

        #region CTORs
        public CategoryTitleVo(string value)
        {
            Validation(value);
            Value = value;
        }
        private CategoryTitleVo() { }
        #endregion

        #region Check Validation Method
        private void Validation(string value)
        {
            if (string.IsNullOrEmpty(value))
                throw new InvalidValueObjectStateException("ValidationErrorIsRequired", nameof(CategoryTitleVo));
            if (value.Length > 150)
                throw new InvalidValueObjectStateException("ValidationErrorStringLength", nameof(CategoryTitleVo));

        }
        #endregion

        #region Class Methods Override 
        public override string ToString() => Value!;
        #endregion

        #region Override Methods In Parent Class
        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Value!;
        }
        #endregion

        #region Casting Excplicit And Implicit Operator Override
        public static explicit operator string(CategoryTitleVo title) => title.Value!.ToString();
        public static implicit operator CategoryTitleVo(string value) => new CategoryTitleVo(value);
        #endregion
    }
}
