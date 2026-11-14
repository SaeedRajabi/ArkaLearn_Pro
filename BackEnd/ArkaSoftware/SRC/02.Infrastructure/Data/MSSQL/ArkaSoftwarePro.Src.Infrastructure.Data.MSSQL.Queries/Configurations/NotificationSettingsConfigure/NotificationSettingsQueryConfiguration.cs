using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.NotificationSettings;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.NotificationSettingsConfigure;

public class NotificationSettingsQueryConfiguration : IEntityTypeConfiguration<NotificationSettingsQueryModel>
{
    public void Configure(EntityTypeBuilder<NotificationSettingsQueryModel> builder)
    {
        builder.ToTable("NotificationSettings", "Website");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ApiKey).HasColumnType("NVARCHAR").HasMaxLength(500);
        builder.Property(x => x.EducationPlanMessageTemplate).HasColumnType("NVARCHAR(MAX)");
    }
}
