using ArkaSoftwarePro.Src.Core.ApplicationService.RoomsServices.Adapters;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Adapters;
using ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityTokenContracts;
using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;

namespace ArkaSoftwarePro.Src.Infrastructure.Security.IMP.Factories
{
    public static class AuthUserAdapterFactory
    {
        public static IAuthenticatableUser Create(object user)
        {
            return user switch
            {
                User u => new AuthUserAdapter(u),
                RoomUser ru => new AuthRoomUserAdapter(ru),
                _ => throw new ArgumentException("Unsupported user type")
            };
        }
    }
}
