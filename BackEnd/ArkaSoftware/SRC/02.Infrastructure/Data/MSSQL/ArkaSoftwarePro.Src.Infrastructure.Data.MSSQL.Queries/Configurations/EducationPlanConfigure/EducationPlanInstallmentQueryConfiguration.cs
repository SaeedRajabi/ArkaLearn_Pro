using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.EducationPlans;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.EducationPlanConfigure;

public class EducationPlanInstallmentQueryConfiguration : IEntityTypeConfiguration<EducationPlanInstallmentQueryModel>
{
    public void Configure(EntityTypeBuilder<EducationPlanInstallmentQueryModel> builder)
    {
        builder.ToTable("EducationPlanInstallments", "Education");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.EducationPlanId).HasColumnName("EducationPlanId");
        builder.Property(x => x.InstallmentNumber).HasColumnName("InstallmentNumber");
        builder.Property(x => x.DueDateUtc).HasColumnName("DueDateUtc");
        builder.Property(x => x.AmountToman).HasColumnName("AmountToman");
        builder.Property(x => x.IsPaid).HasColumnName("IsPaid");
        builder.Property(x => x.PaidAtUtc).HasColumnName("PaidAtUtc");
        builder.Property(x => x.PaymentReference).HasColumnName("PaymentReference").HasMaxLength(200);
        builder.Property(x => x.ReminderSentAtUtc).HasColumnName("ReminderSentAtUtc");
        builder.Property(x => x.IsDelete).HasColumnName("IsDelete");
    }
}
