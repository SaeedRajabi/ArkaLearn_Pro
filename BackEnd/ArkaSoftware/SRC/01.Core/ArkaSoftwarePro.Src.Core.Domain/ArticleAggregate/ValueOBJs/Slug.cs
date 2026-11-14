using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.ArticleAggregate.ValueOBJs
{
    public class Slug : BaseValueOBJs<Slug>
    {
        public string? Value { get; private set; }

        private Slug() { }

        public Slug(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new InvalidValueObjectStateException("ValidationErrorIsRequired", nameof(Slug));
            if (value.Length > 250)
                throw new InvalidValueObjectStateException("ValidationErrorStringLength", nameof(Slug));
            Value = value.Trim().ToLowerInvariant();
        }

        public static Slug Create(string value) => new Slug(value);
        public override string ToString() => Value ?? string.Empty;
        protected override IEnumerable<object> GetEqualityComponents() { yield return Value!; }
    }
}
