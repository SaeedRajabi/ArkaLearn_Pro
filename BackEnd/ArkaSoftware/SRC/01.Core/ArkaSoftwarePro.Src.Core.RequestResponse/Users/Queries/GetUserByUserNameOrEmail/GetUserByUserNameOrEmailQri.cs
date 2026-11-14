namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetUserByUserNameOrEmail
{
    public class GetUserByUserNameOrEmailQri
    {
        public string fullName { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string ProfileImage { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string UserRole { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public bool TwoFactorEnable { get; set; }
        public string CreateDateTime { get; set; } = string.Empty;

    }
}
