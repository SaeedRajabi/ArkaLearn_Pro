using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities
{
    public class FavoriteSeminar : AggregateRoot
    {
        public long UserId { get; private set; }
        public long SeminarId { get; private set; }
        public DateTime CreatedAt { get; private set; }

        public FavoriteSeminar(long userId, long seminarId)
        {
            UserId = userId;
            SeminarId = seminarId;
            CreatedAt = DateTime.UtcNow;
        }

        public FavoriteSeminar()
        {
        }
    }
}
