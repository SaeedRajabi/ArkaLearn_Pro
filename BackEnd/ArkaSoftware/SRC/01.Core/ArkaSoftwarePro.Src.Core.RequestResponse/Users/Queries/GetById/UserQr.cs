namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById
{
    public class UserQr
    {
        public long UserId { get; set; }
        public string? UserName { get; set; }
        public string? FullName { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Email { get; set; }
        public string? Avatar { get; set; }
        public string? Status { get; set; }
        public string? UserRole { get; set; }
    }
}

