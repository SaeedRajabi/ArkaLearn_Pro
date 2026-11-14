using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.SeminarAggregate.ValueOBJs
{
    public class SeminarTitle : BaseValueOBJs<SeminarTitle>
    {
        public string? Value { get; private set; }

        private SeminarTitle() { }

        public SeminarTitle(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new InvalidValueObjectStateException("ValidationErrorIsRequired", nameof(SeminarTitle));
            if (value.Length > 200)
                throw new InvalidValueObjectStateException("ValidationErrorStringLength", nameof(SeminarTitle));
            Value = value.Trim();
        }

        public static SeminarTitle Create(string value) => new SeminarTitle(value);
        public override string ToString() => Value ?? string.Empty;
        protected override IEnumerable<object> GetEqualityComponents() { yield return Value!; }
    }
}
