using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.ValueOBJs
{
    public class RoomLink : BaseValueOBJs<RoomLink>
    {
        public string Link { get; private set; }

        public RoomLink(string link)
        {
            Link = link;
        }
        public static RoomLink Create(string baseUrl , string rooName)
        {
            var link = RoomEntryLinkBuilder.Build(baseUrl, rooName);
            return new RoomLink(link);
        }
        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Link;
        }
        public override string ToString() => Link;
    }
}
