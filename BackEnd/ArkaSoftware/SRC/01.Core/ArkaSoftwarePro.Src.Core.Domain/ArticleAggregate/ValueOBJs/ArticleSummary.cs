using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.ArticleAggregate.ValueOBJs
{
    public class ArticleSummary : BaseValueOBJs<ArticleSummary>
    {
        public string? Value { get; private set; }

        private ArticleSummary() { }

        public ArticleSummary(string value)
        {
            if (value != null && value.Length > 500)
                throw new InvalidValueObjectStateException("ValidationErrorStringLength", nameof(ArticleSummary));
            Value = value ?? string.Empty;
        }

        public static ArticleSummary Create(string value) => new ArticleSummary(value);
        public override string ToString() => Value ?? string.Empty;
        protected override IEnumerable<object> GetEqualityComponents() { yield return Value!; }
    }
}
