using ArkaSoftwarePro.Src.Core.Domain.MediaAssetAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.MediaAssetAggregate.Enumerations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.MediaAssetConfigure;

public class MediaAssetConfiguration : IEntityTypeConfiguration<MediaAsset>
{
    public void Configure(EntityTypeBuilder<MediaAsset> builder)
    {
        builder.ToTable("MediaAssets", "Media");
        builder.Property(x => x.FileUrl).HasMaxLength(500).IsRequired();
        builder.Property(x => x.OriginalFileName).HasMaxLength(260).IsRequired();
        builder.Property(x => x.MimeType).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Title).HasMaxLength(200);
        builder.Property(x => x.AltText).HasMaxLength(500);
        builder.Property(x => x.Caption).HasMaxLength(1000);
        builder.Property(x => x.Description).HasMaxLength(2000);
        builder.Property(x => x.RejectionReason).HasMaxLength(1000);
        builder.Property(x => x.MediaType).IsRequired();
        // Avoid EF sentinel warning: CLR default is Pending(0) while DB default was Approved.
        // Always persist the domain value explicitly; DB column default remains from migrations.
        builder.Property(x => x.ApprovalStatus).IsRequired();
        builder.Property(x => x.IsRejectionDismissed).HasDefaultValue(false);
        builder.Property(x => x.IsDelete).HasColumnName("IsDeleted");

        // DRM / desktop secure player
        builder.Property(x => x.IsEncrypted).HasDefaultValue(false);
        builder.Property(x => x.EncryptedFileUrl).HasMaxLength(500);
        builder.Property(x => x.EncryptionAlgorithm).HasMaxLength(64).HasDefaultValue("AES-256-CBC");
        builder.Property(x => x.ContentKeyId).HasMaxLength(128);
        builder.Property(x => x.EncryptionIvBase64).HasMaxLength(128);
        builder.Property(x => x.ContentChecksumSha256).HasMaxLength(128);
        builder.Property(x => x.EncryptionStatus)
            .IsRequired()
            .HasDefaultValue(EncryptedMediaStatus.None);

        builder.HasIndex(x => x.OwnerUserId);
        builder.HasIndex(x => new { x.IsDelete, x.ApprovalStatus });
        builder.HasIndex(x => x.ContentKeyId);
        builder.HasIndex(x => x.IsEncrypted);
    }
}
