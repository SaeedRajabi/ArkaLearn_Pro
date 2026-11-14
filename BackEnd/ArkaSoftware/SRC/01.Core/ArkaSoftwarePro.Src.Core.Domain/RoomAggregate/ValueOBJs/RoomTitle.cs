using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.ValueOBJs
{
    public class RoomTitle : BaseValueOBJs<RoomTitle>
    {
        public string Value { get; private set; }
        private RoomTitle(string value)
        {
            Value = value;
        }
        public static RoomTitle Create(string title)
        {
            if (string.IsNullOrWhiteSpace(title))
                throw new ArgumentException("Title cannot be empty.");

            if (title.Length > 150)
                throw new ArgumentException("Title cannot exceed 150 characters.");

            return new RoomTitle(title.Trim());
        }
        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Value;
        }
        public override string ToString() => Value;
    }
}
