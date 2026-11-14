using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.MediaUploadSettings;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.MediaUploadSettingsConfigure;

public class MediaUploadSettingsQueryConfiguration : IEntityTypeConfiguration<MediaUploadSettingsQueryModel>
{
    public void Configure(EntityTypeBuilder<MediaUploadSettingsQueryModel> builder)
    {
        builder.ToTable("MediaUploadSettings", "Website");
        builder.HasKey(x => x.Id);
    }
}
