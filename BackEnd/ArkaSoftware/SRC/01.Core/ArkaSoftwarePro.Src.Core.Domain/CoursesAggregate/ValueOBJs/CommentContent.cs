using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.ValueOBJs
{
    public class CommentContent : BaseValueOBJs<CommentContent>
    {
        #region Factories
        public static CommentContent FromString(string value) => new CommentContent(value);

        #endregion

        #region Properties
        public string? Value { get; private set; }
        #endregion

        #region CTORs
        public CommentContent(string value)
        {
            Validation(value);
            Value = value;
        }
        private CommentContent() { }
        #endregion

        #region Check Validation Method
        private void Validation(string value)
        {
            if (string.IsNullOrEmpty(value))
                throw new InvalidValueObjectStateException("ValidationErrorIsRequired", nameof(CommentContent));
            if (value.Length > 600)
                throw new InvalidValueObjectStateException("ValidationErrorStringLength", nameof(CommentContent));

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
        public static explicit operator string(CommentContent title) => title.Value!.ToString();
        public static implicit operator CommentContent(string value) => new CommentContent(value);
        #endregion
    }
}
