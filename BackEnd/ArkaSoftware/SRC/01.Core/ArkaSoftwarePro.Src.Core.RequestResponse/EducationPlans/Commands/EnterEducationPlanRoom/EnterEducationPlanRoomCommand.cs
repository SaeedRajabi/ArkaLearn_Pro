using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Commands.EnterEducationPlanRoom;

public class EnterEducationPlanRoomCommand : ICommand<EnterEducationPlanRoomResult>, IWebRequest
{
    public long PlanId { get; set; }
    public long UserId { get; set; }

    public string Path => "/api/Service/EducationPlan/EnterRoom";
}

public class EnterEducationPlanRoomResult
{
    public string? RoomLink { get; set; }
    public string? Token { get; set; }
    public string? UserId { get; set; }
    public string? UserName { get; set; }
    public string? DisplayName { get; set; }
    public string? AvatarUrl { get; set; }
    public string? Email { get; set; }
    public string Role { get; set; } = "student";
}
