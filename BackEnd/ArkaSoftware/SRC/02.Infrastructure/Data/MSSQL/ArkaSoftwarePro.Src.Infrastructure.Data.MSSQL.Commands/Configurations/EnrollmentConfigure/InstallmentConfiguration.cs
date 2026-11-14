using ArkaSoftwarePro.Src.Core.Domain.EnrollmentAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.EnrollmentConfigure
{
    public class InstallmentConfiguration : IEntityTypeConfiguration<Installment>
    {
        public void Configure(EntityTypeBuilder<Installment> builder)
        {
            builder.ToTable("Installments", "Enrollment");
            builder.Property(x => x.InstallmentNumber).HasDefaultValue(1);
            builder.Property(x => x.Amount).HasColumnType("DECIMAL(18,4)");
            builder.Property(x => x.PaymentReference).HasMaxLength(200);
            builder.HasIndex(x => new { x.EnrollmentId, x.InstallmentNumber });
            builder.HasIndex(x => x.DueDate);
        }
    }
}
