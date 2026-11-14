using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.SeminarAggregate.Entities
{
    public class SeminarRegistration : Entity
    {
        public long UserId { get; private set; }
        public long SeminarId { get; private set; }
        public bool HasPaid { get; private set; }
        public DateTime RegisteredAt { get; private set; }

        public Seminar? Seminar { get; private set; }

        private SeminarRegistration() { }

        public SeminarRegistration(long userId, long seminarId, bool hasPaid)
        {
            UserId = userId;
            SeminarId = seminarId;
            HasPaid = hasPaid;
            RegisteredAt = DateTime.UtcNow;
        }

        public static SeminarRegistration Create(long userId, long seminarId, bool hasPaid)
            => new SeminarRegistration(userId, seminarId, hasPaid);

        public void SetPaid(bool paid) => HasPaid = paid;
    }
}
