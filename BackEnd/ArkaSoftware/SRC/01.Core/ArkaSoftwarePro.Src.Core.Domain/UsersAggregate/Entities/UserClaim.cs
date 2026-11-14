    using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs;
using Framework.Src.Core.Domain.Entities;
using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities
{
    public class UserClaim : Entity
    {
        public long UserId { get; private set; }
        public ClaimVT ClaimType { get; private set; }
        public ClaimVT ClaimValue { get; private set; }

        public UserClaim(PId userId, ClaimVT claimType, ClaimVT claimValue)
        {
            UserId = userId.Value;
            ClaimType = claimType;
            ClaimValue = claimValue;
        }

        private UserClaim()
        {

        }


    }
}
