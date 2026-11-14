using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.LoginUsers
{
    public class LoginUser : ICommand<object>, IWebRequest
    {
        public string? UserNameOrEmail { get; set; }
        public string? Password { get; set; }

        /// <summary>Optional sliding-puzzle captcha id from /Account/LoginCaptcha/Challenge.</summary>
        public string? CaptchaId { get; set; }

        /// <summary>Slider position 0–100 submitted by the client puzzle.</summary>
        public int? CaptchaSlidePercent { get; set; }

        /// <summary>Caller app id, e.g. AdminDashboard — used to scope bot/captcha checks.</summary>
        public string? ClientApp { get; set; }

        public string Path => "/api/Service/User/Login";
    }
}
