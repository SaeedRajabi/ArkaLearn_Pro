namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetUserByToken
{
    public class UserByTokenQri
    {
        public string? Id { get; set; }
        public string? UserName { get; set; }
        public string? FullName { get; set; }
        public string? Role { get; set; }
        public string? Email { get; set; }
        public bool EmailVerified { get; set; }
        public string? HasedPassword { get; set; }
        public string? ProfileImage { get; set; }

    }
}
