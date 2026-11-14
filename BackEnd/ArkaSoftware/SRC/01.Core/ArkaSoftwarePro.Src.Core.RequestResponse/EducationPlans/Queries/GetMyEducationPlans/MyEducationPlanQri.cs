using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Queries.GetMyEducationPlans;

public class MyEducationPlanQri
{
    public long PlanId { get; set; }
    public string? Title { get; set; }
    public string? PlanTypeLabel { get; set; }
    public DateTime StartDateUtc { get; set; }
    public DateTime EndDateUtc { get; set; }
    public int TotalHours { get; set; }
    public int UsedMinutes { get; set; }
    public int RemainingMinutes { get; set; }
    public decimal RemainingHours { get; set; }
    public long RoomId { get; set; }
    public string? RoomTitle { get; set; }
    public string? RoomSlug { get; set; }
    public bool IsActive { get; set; }
    public long OwnerUserId { get; set; }
    public string? OwnerFullName { get; set; }
    public string PaymentType { get; set; } = "cash";
    public decimal BaseTotalCostToman { get; set; }
    public decimal FinalTotalCostToman { get; set; }
    public bool PaymentBlocked { get; set; }
    public List<EducationPlanInstallmentQri> Installments { get; set; } = [];
}
