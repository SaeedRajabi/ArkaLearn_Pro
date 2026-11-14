using ArkaSoftwarePro.Src.Core.Domain.EducationPlanAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.EducationPlanConfigure;

public class EducationPlanSessionUsageConfiguration : IEntityTypeConfiguration<EducationPlanSessionUsage>
{
    public void Configure(EntityTypeBuilder<EducationPlanSessionUsage> builder)
    {
        builder.ToTable("EducationPlanSessionUsages", "Education");
        builder.HasIndex(x => new { x.EducationPlanId, x.RoomSessionId }).IsUnique();
    }
}
