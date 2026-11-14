using ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityTokenContracts;

namespace ArkaSoftwarePro.Src.Endpoints.API.Common
{
    public class UserDeviceInfoService : IUserDeviceInfoService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public UserDeviceInfoService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }
        public (string IpAddress, string UserAgent) GetUserInfo()
        {
            var httpContext = _httpContextAccessor.HttpContext;
            var userAgent = httpContext?.Request?.Headers["User-Agent"].ToString();
            var ipAddress = httpContext?.Connection?.RemoteIpAddress!.ToString();
            //if (ipAddress == null)
            //    return ("0.0.0.0", userAgent!);
            //if (ipAddress.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
            //{
            //    return (ipAddress.ToString(), userAgent!);
            //}
            //if (ipAddress.AddressFamily == System.Net.Sockets.AddressFamily.InterNetworkV6)
            //{
            //    var ipv4Address = ipAddress.MapToIPv4();
            //    return (ipv4Address.ToString(), userAgent!);
            //}
            return (ipAddress!, userAgent!);
        }
    }
}
