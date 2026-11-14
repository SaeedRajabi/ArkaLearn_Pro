using ArkaSoftwarePro.Src.Core.Domain.FileStorageAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.FileStorage;

public sealed class FileStorageMigrationConfig : IEntityTypeConfiguration<FileStorageMigration>
{
    public void Configure(EntityTypeBuilder<FileStorageMigration> builder)
    {
        builder.ToTable("FileStorageMigrations", "Storage");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.SourcePath).HasMaxLength(1000).IsRequired();
        builder.Property(x => x.ObjectKey).HasMaxLength(1000).IsRequired();
        builder.Property(x => x.AccessTier).HasMaxLength(32).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(32).IsRequired();
        builder.Property(x => x.Error).HasMaxLength(2000);
        builder.HasIndex(x => x.SourcePath).IsUnique();
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.ObjectKey);
    }
}
