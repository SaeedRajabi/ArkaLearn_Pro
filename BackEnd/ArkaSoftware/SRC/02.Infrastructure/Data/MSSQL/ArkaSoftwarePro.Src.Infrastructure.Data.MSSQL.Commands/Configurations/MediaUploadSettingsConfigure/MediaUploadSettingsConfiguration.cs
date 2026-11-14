using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MediaUploadSettingsEntity = ArkaSoftwarePro.Src.Core.Domain.MediaUploadSettingsAggregate.Entities.MediaUploadSettings;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.MediaUploadSettingsConfigure;

public class MediaUploadSettingsConfiguration : IEntityTypeConfiguration<MediaUploadSettingsEntity>
{
    public void Configure(EntityTypeBuilder<MediaUploadSettingsEntity> builder)
    {
        builder.ToTable("MediaUploadSettings", "Website");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.CourseIntroMaxDurationMinutes).IsRequired().HasDefaultValue(5);
        builder.Property(x => x.PromotionalVideoMaxDurationMinutes).IsRequired().HasDefaultValue(5);
        builder.Property(x => x.IsDelete).HasColumnType("bit");
    }
}
