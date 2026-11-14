using ArkaSoftwarePro.Src.Core.Domain.EnrollmentAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.EnrollmentConfigure
{
    public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
    {
        public void Configure(EntityTypeBuilder<Payment> builder)
        {
            builder.ToTable("Payments", "Enrollment");
            builder.Property(x => x.Amount).HasColumnType("DECIMAL(18,4)");
        }
    }
}
