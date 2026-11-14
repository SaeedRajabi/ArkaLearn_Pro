using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.EducationPlans;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.EducationPlanConfigure
{
    public class EducationPlanConfiguration : IEntityTypeConfiguration<EducationPlanQueryModel>
    {
        public void Configure(EntityTypeBuilder<EducationPlanQueryModel> builder)
        {
            builder.ToTable("EducationPlans", "Education");
            builder.HasKey(x => x.CoursePlanId).HasName("Id");
            builder.Property(x => x.CoursePlanId).HasColumnName("Id");
            builder.Property(x => x.Title).HasColumnName("Title");
            builder.Property(x => x.Description).HasColumnName("Description");
            builder.Property(x => x.HourlyRate).HasColumnName("HourlyRate");
            builder.Property(x => x.TotalHours).HasColumnName("TotalHours");
            builder.Property(x => x.TotalCost).HasColumnName("Amount");
            builder.Property(x => x.ManagedRoomStudentId).HasColumnName("ManagedRoomStudentId");
            builder.Property(x => x.RoomId).HasColumnName("RoomId");
            builder.Property(x => x.OwnerUserId).HasColumnName("OwnerUserId");
            builder.Property(x => x.StartDateUtc).HasColumnName("StartDateUtc");
            builder.Property(x => x.EndDateUtc).HasColumnName("EndDateUtc");
            builder.Property(x => x.UsedMinutes).HasColumnName("UsedMinutes");
            builder.Property(x => x.IsDelete).HasColumnName("IsDelete");
            builder.Property(x => x.PaymentType).HasColumnName("PaymentType");
            builder.Property(x => x.BaseTotalCostToman).HasColumnName("BaseTotalCostToman");
            builder.Property(x => x.FinalTotalCostToman).HasColumnName("FinalTotalCostToman");

            builder.HasMany(x => x.Courses).WithOne(x => x.CoursePlan).HasForeignKey(x => x.CoursePlanId).OnDelete(DeleteBehavior.Cascade);
        }
    }
}
