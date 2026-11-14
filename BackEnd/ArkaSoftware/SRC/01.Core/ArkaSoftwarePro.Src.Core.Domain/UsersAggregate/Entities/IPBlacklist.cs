using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs;
using Framework.Src.Core.Domain.Entities;
using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities
{
    public class IPBlacklist : Entity
    {
        public UserEnvironmentInfo? UserEnvironmentInfo { get; set; }
        public Description? Reason { get; set; }
        public DateTime AddedDate { get; set; }
        public DateTime ExpirationDate { get; set; }


        // Methods And Functions
        public IPBlacklist(string ipAddress, string userInfo, string description)
        {
            UserEnvironmentInfo = UserEnvironmentInfo.Create(ipAddress, userInfo);
            Reason = description;
            AddedDate = DateTime.Now;
            ExpirationDate = DateTime.Now;
        }
        public IPBlacklist()
        {

        }


        public static IPBlacklist Create(string ipAddress, string userInfo, string description, bool permanent = true)
        {
            var entry = new IPBlacklist(ipAddress, userInfo, description);
            entry.ExpirationDate = permanent ? DateTime.MaxValue : entry.AddedDate.AddMinutes(15);
            return entry;
        }

        public bool IsActive()
            => !IsDelete && ExpirationDate > DateTime.UtcNow;

        public void RemoveFromBlacklist()
            => IsDelete = true;

        public void AddExpirationDate(int mnt)
        {
            ExpirationDate = ExpirationDate.AddMinutes(mnt);
        }
    }
}
