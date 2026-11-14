using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs;
using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities
{
    public class TwoFactorCode : Entity
    {
        public long UserId { get; private set; }
        public AuthenticateCode? Code { get; private set; }
        public DateTime GeneratedAt { get; private set; }
        public DateTime ExpirationTime { get; private set; }
        public bool IsUsed { get; private set; }


        // Methods And Functions

        public void GenerateCode() { }
        public void ValidateCode() { }
        public void MarkAsUsed() { }

    }
}
