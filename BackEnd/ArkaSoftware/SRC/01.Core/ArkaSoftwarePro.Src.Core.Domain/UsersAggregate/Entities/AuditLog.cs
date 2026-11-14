using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs;
using Framework.Src.Core.Domain.Entities;
using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities
{
    public class AuditLog : Entity
    {
        public long UserId { get; private set; }
        public ActionType Action { get; private set; }
        public DateTime? TimeStamp { get; private set; }
        public UserEnvironmentInfo? UserEnvironmentInfo { get; private set; }

        private AuditLog(PId? userId, ActionType action, DateTime timeStamp, string iPAddress, string DeviceInfo)
        {
            UserId = userId!.Value;
            Action = action;
            TimeStamp = timeStamp;
            UserEnvironmentInfo = UserEnvironmentInfo.Create(iPAddress, DeviceInfo);
        }

        private AuditLog() { }

        // Methods And Functions


        public static AuditLog CreateLog(long userId, ActionType action, DateTime timeStamp, string iPAddress, string DeviceInfo)
        {
            AuditLog auditLog = new AuditLog(new PId(userId), action, timeStamp, iPAddress, DeviceInfo);
            return auditLog;

        }

        public void LoginAction() { }
        public void GetUserLogs() { }
    }
}
