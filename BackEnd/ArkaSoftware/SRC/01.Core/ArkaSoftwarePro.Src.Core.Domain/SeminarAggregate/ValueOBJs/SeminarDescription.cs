using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.SeminarAggregate.ValueOBJs
{
    public class SeminarDescription : BaseValueOBJs<SeminarDescription>
    {
        public string? Value { get; private set; }

        private SeminarDescription() { }

        public SeminarDescription(string value)
        {
            Value = value ?? string.Empty;
        }

        public static SeminarDescription Create(string value) => new SeminarDescription(value);
        public override string ToString() => Value ?? string.Empty;
        protected override IEnumerable<object> GetEqualityComponents() { yield return Value!; }
    }
}
