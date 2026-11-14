using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.AddAuditLogs
{
    public class AddAuditLog : ICommand<long>
    {
        public string IPAddress { get; set; } = string.Empty;
        public string DeviceInfo { get; set; } = string.Empty;
        public string ChangedLogDescription { get; set; } = string.Empty;


    }
}
