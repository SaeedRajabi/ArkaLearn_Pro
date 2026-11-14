using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.UserFiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.UserFilesConfigure;

public class UserFileQueryModelConfiguration : IEntityTypeConfiguration<UserFileQueryModel>
{
    public void Configure(EntityTypeBuilder<UserFileQueryModel> builder)
    {
        builder.ToTable("UserFiles");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.ModifiedByUserId).HasMaxLength(50);
        builder.Property(x => x.CreatedByUserId).HasMaxLength(50);

        // Computed from audit columns — must not be selected as its own DB field.
        builder.Ignore(x => x.UploadedByUserId);
    }
}
