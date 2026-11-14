namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.EducationPlans;

public class EducationPlanInstallmentQueryModel
{
    public long Id { get; set; }
    public long EducationPlanId { get; set; }
    public int InstallmentNumber { get; set; }
    public DateTime DueDateUtc { get; set; }
    public decimal AmountToman { get; set; }
    public bool IsPaid { get; set; }
    public DateTime? PaidAtUtc { get; set; }
    public string? PaymentReference { get; set; }
    public DateTime? ReminderSentAtUtc { get; set; }
    public bool IsDelete { get; set; }
}
