using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.Domain.EducationPlanAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.EducationPlanAggregate.Enumerations;
using Framework.Src.Core.Domain.ValueOBJs;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.EducationPlanConfigure
{
    public class EducationPlanConfiguration : IEntityTypeConfiguration<EducationPlan>
    {
        public void Configure(EntityTypeBuilder<EducationPlan> builder)
        {
            builder.ToTable("EducationPlans", "Education");
            builder.Property(x => x.Title).HasColumnType("NVARCHAR").HasMaxLength(100).HasConversion(x => x!.Value, x => new Title(x!));
            builder.Property(x => x.Description).HasMaxLength(500).HasConversion(x => x!.Value, x => new Description(x));
            builder.Property(x => x.ManagedRoomStudentId).IsRequired();
            builder.Property(x => x.RoomId).IsRequired();
            builder.Property(x => x.OwnerUserId).IsRequired();
            builder.Property(x => x.StartDateUtc).IsRequired();
            builder.Property(x => x.EndDateUtc).IsRequired();
            builder.Property(x => x.UsedMinutes).HasDefaultValue(0);
            builder.Property(x => x.PaymentType)
                .HasConversion<byte>()
                .HasDefaultValue(EducationPlanPaymentType.Cash);
            builder.Property(x => x.BaseTotalCostToman).HasColumnType("DECIMAL(18,0)").HasDefaultValue(0);
            builder.Property(x => x.FinalTotalCostToman).HasColumnType("DECIMAL(18,0)").HasDefaultValue(0);

            builder.OwnsOne(x => x.TotalCost, cost =>
            {
                cost.Property(info => info.Amount).HasColumnName("Amount").HasColumnType("DECIMAL(18,4)").IsRequired();
                cost.Property(info => info.Currency).HasColumnName("Currency").HasColumnType("VARCHAR").HasMaxLength(50).IsRequired();
            });

            builder.HasMany(e => e.Installments)
                .WithOne(i => i.EducationPlan)
                .HasForeignKey(i => i.EducationPlanId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Navigation(e => e.Installments)
                .HasField("_installments")
                .UsePropertyAccessMode(PropertyAccessMode.Field);

            builder.HasMany(e => e.SessionUsages)
                .WithOne()
                .HasForeignKey(u => u.EducationPlanId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Navigation(e => e.SessionUsages)
                .HasField("_sessionUsages")
                .UsePropertyAccessMode(PropertyAccessMode.Field);

            builder.HasIndex(x => x.RoomId);
            builder.HasIndex(x => x.ManagedRoomStudentId);
        }
    }
}
