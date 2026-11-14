namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetUserByCookie
{
    public class GetUserByCookieQri
    {
        public string? Id { get; set; }
        public string? UserName { get; set; }
        public string? FullName { get; set; }
        public string? Role { get; set; }
        public string? Email { get; set; }
        public bool EmailVerified { get; set; }
        public string? PhoneNumber { get; set; }
        public bool PhoneNumberVerified { get; set; }
        public bool TwoFactorEnabled { get; set; }
        public string? ProfileImage { get; set; }
        public string? Status { get; set; }
    }
}
