namespace ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Queries.GetEducationPlanById;

using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Queries;

public class GetEducationPlanByIdQri
{
    public long PlanId { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public int HourlyRate { get; set; }
    public int TotalHours { get; set; }
    public decimal TotalCost { get; set; }
    public long ManagedRoomStudentId { get; set; }
    public long RoomId { get; set; }
    public long OwnerUserId { get; set; }
    public string? OwnerFullName { get; set; }
    public DateTime StartDateUtc { get; set; }
    public DateTime EndDateUtc { get; set; }
    public int UsedMinutes { get; set; }
    public int RemainingMinutes { get; set; }
    public decimal UsedHours { get; set; }
    public decimal RemainingHours { get; set; }
    public string? StudentFullName { get; set; }
    public string? StudentUserName { get; set; }
    public string? RoomTitle { get; set; }
    public string? RoomSlug { get; set; }
    public string PaymentType { get; set; } = "cash";
    public decimal BaseTotalCostToman { get; set; }
    public decimal FinalTotalCostToman { get; set; }
    public bool PaymentBlocked { get; set; }
    public List<EducationPlanInstallmentQri> Installments { get; set; } = [];
}
