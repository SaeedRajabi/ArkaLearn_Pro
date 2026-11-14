using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SupportSubscription.Commands.RequestStudentSupportFreeze;

public class RequestStudentSupportFreezeCommand : ICommand<string>
{
    public long UserId { get; set; }
    public int FreezeDays { get; set; }
    public string Reason { get; set; } = string.Empty;
}
