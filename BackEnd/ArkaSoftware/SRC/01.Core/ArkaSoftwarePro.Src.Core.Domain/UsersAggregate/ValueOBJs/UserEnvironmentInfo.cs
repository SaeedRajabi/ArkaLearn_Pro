using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.Domain.ValueOBJs;
using System.Net;

namespace ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs
{
    public class UserEnvironmentInfo : BaseValueOBJs<UserEnvironmentInfo>
    {
        #region Factories
        public static UserEnvironmentInfo Create(string ipAddressString, string deviceInfo) // ::1 => IPV6   127.0.0.1 => IPV4
        {
            if (string.IsNullOrWhiteSpace(ipAddressString))
                throw new InvalidValueObjectStateException("IP address string cannot be empty.", nameof(ipAddressString));
            if (ipAddressString == "::1")
                ipAddressString = "127.0.0.1";

            return new UserEnvironmentInfo(ipAddressString, deviceInfo);
        }

        public static UserEnvironmentInfo Create(string ipAddressString)
        {
            if (string.IsNullOrWhiteSpace(ipAddressString))
                throw new InvalidValueObjectStateException("IP address string cannot be empty.", nameof(ipAddressString));

            return new UserEnvironmentInfo(ipAddressString, null!);
        }
        #endregion

        #region Properties
        public string IPAddress { get; private set; }
        public string? DeviceInfo { get; private set; }
        #endregion

        #region CTORs
        private UserEnvironmentInfo(string iPAddress, string? deviceInfo)
        {
            Validation(iPAddress, deviceInfo!);
            IPAddress = iPAddress;
            DeviceInfo = deviceInfo;
        }
        private UserEnvironmentInfo() { }
        #endregion

        #region Check Validation Method
        private void Validation(string iPAddress, string deviceInfo)
        {
            if (iPAddress == null)
                IPAddress = "0.0.0.0";
            if (string.IsNullOrWhiteSpace(deviceInfo))
                deviceInfo = "Unknown Device";
            if (deviceInfo.Length > 200)
                throw new InvalidValueObjectStateException("Device information is too long.", nameof(deviceInfo));
        }
        #endregion

        #region Class Methods Override 
        public override string ToString() => $"{IPAddress} ({DeviceInfo})";
        #endregion

        #region Override Methods In Parent Class
        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return new { IPAddress, DeviceInfo };
        }
        #endregion

        #region Casting Excplicit And Implicit Operator Override
        public static explicit operator string(UserEnvironmentInfo title) => title.ToString();
        public static implicit operator UserEnvironmentInfo((string ipAddress, string deviceInfo) value)
                => Create(value.ipAddress, value.deviceInfo);
        #endregion
    }
}
