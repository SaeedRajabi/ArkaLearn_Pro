namespace ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Queries.GetAdminInstallmentPlans;

public class AdminEducationPlanInstallmentListItemQri
{
    public long PlanId { get; set; }
    public string PlanTitle { get; set; } = string.Empty;
    public long ManagedRoomStudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string? StudentUserName { get; set; }
    public long OwnerUserId { get; set; }
    public string? TeacherName { get; set; }
    public string? RoomTitle { get; set; }
    public DateTime StartDateUtc { get; set; }
    public DateTime EndDateUtc { get; set; }
    public decimal FinalTotalCostToman { get; set; }
    public int InstallmentCount { get; set; }
    public int PaidInstallmentCount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingAmount { get; set; }
    public List<AdminInstallmentItemQri> Installments { get; set; } = new();
}

public class AdminInstallmentItemQri
{
    public long Id { get; set; }
    public int Number { get; set; }
    public decimal Amount { get; set; }
    public DateTime DueDate { get; set; }
    public bool IsPaid { get; set; }
    public DateTime? PaidDate { get; set; }
    public string? PaymentReference { get; set; }
    public bool IsOverdue { get; set; }
}
