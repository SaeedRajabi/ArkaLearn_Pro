using Framework.Src.Core.Domain.Entities;
using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities
{
    public class UserSession : Entity
    {
        public long UserId { get; private set; }
        public DateTime ExpirationTime { get; private set; }
        public bool IsActive { get; private set; }
        public bool IsExpired => ExpirationTime <= DateTime.UtcNow;


        private UserSession() { }
        public UserSession(PId userId, DateTime expireAt)
        {
            UserId = userId.Value;
            ExpirationTime = expireAt;
            IsActive = true;
        }

        // Methods And Functions

        public static UserSession Create(PId userId, DateTime expireAt)
            => new UserSession(userId, expireAt);

        public void ExpireSession()
        {
            IsActive = false;
            ExpirationTime = DateTime.Now;
        }
        public void TerminateSession() { }
        public void RefreshSession() { }
        public bool IsValid()
        {
            return IsActive && ExpirationTime > DateTime.Now;
        }
        public void ChangeExpirationTime(DateTime expirationTime)
        {
            ExpirationTime = expirationTime;
        }
        public void Deactivate()
        {
            IsActive = false;
        }
    }
}
