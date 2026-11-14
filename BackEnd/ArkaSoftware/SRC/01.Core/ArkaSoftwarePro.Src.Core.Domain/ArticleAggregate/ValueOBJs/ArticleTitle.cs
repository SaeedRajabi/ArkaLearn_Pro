using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.ArticleAggregate.ValueOBJs
{
    public class ArticleTitle : BaseValueOBJs<ArticleTitle>
    {
        public string? Value { get; private set; }

        private ArticleTitle() { }

        public ArticleTitle(string value)
        {
            Validation(value);
            Value = value;
        }

        public static ArticleTitle Create(string value) => new ArticleTitle(value);

        private void Validation(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new InvalidValueObjectStateException("ValidationErrorIsRequired", nameof(ArticleTitle));
            if (value.Length > 200)
                throw new InvalidValueObjectStateException("ValidationErrorStringLength", nameof(ArticleTitle));
        }

        public override string ToString() => Value ?? string.Empty;
        protected override IEnumerable<object> GetEqualityComponents() { yield return Value!; }
    }
}
