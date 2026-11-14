using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SupportSubscription.Commands.GrantStudentSupportMonths;

public class GrantStudentSupportMonthsCommand : ICommand<string>
{
    public long ActorUserId { get; set; }
    public bool ActorIsAdmin { get; set; }
    /// <summary>String to preserve snowflake precision from JSON clients.</summary>
    public string? StudentUserId { get; set; }
    public int Months { get; set; }
}
