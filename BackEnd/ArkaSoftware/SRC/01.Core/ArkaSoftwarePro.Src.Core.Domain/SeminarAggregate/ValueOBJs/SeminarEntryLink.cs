using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.SeminarAggregate.ValueOBJs
{
    public class SeminarEntryLink : BaseValueOBJs<SeminarEntryLink>
    {
        public string? Value { get; private set; }

        private SeminarEntryLink() { }

        public SeminarEntryLink(string value)
        {
            Value = value ?? string.Empty;
        }

        public static SeminarEntryLink Create(string value) => new SeminarEntryLink(value);
        public override string ToString() => Value ?? string.Empty;
        protected override IEnumerable<object> GetEqualityComponents() { yield return Value!; }
    }
}
