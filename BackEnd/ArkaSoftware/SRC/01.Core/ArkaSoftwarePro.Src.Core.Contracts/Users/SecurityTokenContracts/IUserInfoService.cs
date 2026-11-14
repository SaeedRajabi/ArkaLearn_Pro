namespace ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityTokenContracts
{
    public interface IUserDeviceInfoService
    {
        /// <summary>
        /// دریافت اطلاعات IP و مشخصات سیستم کاربر (User-Agent)
        /// </summary>
        /// <returns>IP کاربر و User-Agent</returns>
        (string IpAddress, string UserAgent) GetUserInfo();
    }
}
