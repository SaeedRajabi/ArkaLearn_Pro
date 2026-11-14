using ArkaSoftwarePro.Src.Core.Domain.UserFileAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.UserFiles.Configs;

public class UserFileConfig : IEntityTypeConfiguration<UserFile>
{
    public void Configure(EntityTypeBuilder<UserFile> builder)
    {
        builder.ToTable("UserFiles");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.UserId).IsRequired();
        builder.Property(x => x.ParentId).IsRequired(false);
        builder.Property(x => x.Name).HasMaxLength(255).IsRequired();
        builder.Property(x => x.IsFolder).IsRequired();
        builder.Property(x => x.FileUrl).HasMaxLength(1000).IsRequired(false);
        builder.Property(x => x.FileSize).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();

        // DB has no UploadedByUserId column — uploader is stored in auditable ModifiedByUserId.
        builder.Ignore(x => x.UploadedByUserId);
    }
}