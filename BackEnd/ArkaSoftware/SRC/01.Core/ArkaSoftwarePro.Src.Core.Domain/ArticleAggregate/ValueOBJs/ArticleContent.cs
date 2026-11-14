using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.ArticleAggregate.ValueOBJs
{
    public class ArticleContent : BaseValueOBJs<ArticleContent>
    {
        public string? Value { get; private set; }

        private ArticleContent() { }

        public ArticleContent(string value)
        {
            Value = value ?? string.Empty;
        }

        public static ArticleContent Create(string value) => new ArticleContent(value);
        public override string ToString() => Value ?? string.Empty;
        protected override IEnumerable<object> GetEqualityComponents() { yield return Value!; }
    }
}
