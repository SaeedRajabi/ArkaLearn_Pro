namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.LoginUsers
{
    public class LoginUserResponse
    {
        public long UserId { get; set; }
        public long SessionId { get; set; }
        public string AccessToken { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string ImageURL { get; set; } = string.Empty;


    }
}
