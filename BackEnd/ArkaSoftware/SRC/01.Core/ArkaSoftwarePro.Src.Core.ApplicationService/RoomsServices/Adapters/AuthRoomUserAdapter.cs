using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityTokenContracts;
using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RoomsServices.Adapters
{
    public class AuthRoomUserAdapter(RoomUser roomUser):IAuthenticatableUser
    {

        public long Id => roomUser.Id;
        public string UserName => roomUser.UserName!.Value;
        public string Email =>
            !string.IsNullOrWhiteSpace(roomUser.Email)
                ? roomUser.Email!
                : $"{UserName}@room.local";
        public string? FirstName => roomUser.Name?.FirstName;
        public string? LastName => roomUser.Name?.LastName;
        public Guid BusinessId => roomUser.BusinessId.Value;
        public string Role => "STUDENT";


        public void AddClaims(List<Claim> claims)
        {
            if (!string.IsNullOrWhiteSpace(roomUser.PhotoUrl))
                claims.Add(new Claim("avatar_url", roomUser.PhotoUrl));
        }

        public bool ClaimExist()
        {
            return false;
        }
    }
}
