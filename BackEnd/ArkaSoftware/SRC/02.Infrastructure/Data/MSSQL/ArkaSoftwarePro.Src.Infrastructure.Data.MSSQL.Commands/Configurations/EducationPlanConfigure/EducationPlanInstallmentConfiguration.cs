using ArkaSoftwarePro.Src.Core.Domain.EducationPlanAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.EducationPlanConfigure;

public class EducationPlanInstallmentConfiguration : IEntityTypeConfiguration<EducationPlanInstallment>
{
    public void Configure(EntityTypeBuilder<EducationPlanInstallment> builder)
    {
        builder.ToTable("EducationPlanInstallments", "Education");
        builder.Property(x => x.InstallmentNumber).IsRequired();
        builder.Property(x => x.DueDateUtc).IsRequired();
        builder.Property(x => x.AmountToman).HasColumnType("DECIMAL(18,0)").IsRequired();
        builder.Property(x => x.PaymentReference).HasMaxLength(200);
        builder.Property(x => x.ReminderSentOffsetsJson).HasColumnType("NVARCHAR(200)").HasMaxLength(200).IsRequired();
        builder.HasIndex(x => new { x.EducationPlanId, x.InstallmentNumber }).IsUnique();
        builder.HasIndex(x => x.DueDateUtc);
    }
}
