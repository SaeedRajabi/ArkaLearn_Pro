using ArkaSoftwarePro.Src.Core.Domain.DesktopAppReleaseAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.RemoteAssistAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.Desktop;

/// <summary>
/// Desktop schema soft-delete columns are named <c>IsDeleted</c> (same convention as Media.MediaAssets).
/// Domain AggregateRoot property remains <c>IsDelete</c>.
/// </summary>
internal static class DesktopSoftDeleteMapping
{
    public static void MapIsDeletedColumn<TEntity>(EntityTypeBuilder<TEntity> builder)
        where TEntity : class
        => builder.Property("IsDelete").HasColumnName("IsDeleted");
}

public class DesktopAppLicenseConfig : IEntityTypeConfiguration<DesktopAppLicense>
{
    public void Configure(EntityTypeBuilder<DesktopAppLicense> builder)
    {
        builder.ToTable("DesktopAppLicenses", "Desktop");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.UserId).IsRequired();
        builder.Property(x => x.Status).IsRequired();
        builder.Property(x => x.DeviceFingerprint).HasMaxLength(256);
        builder.Property(x => x.RevokeReason).HasMaxLength(1000);
        builder.HasIndex(x => x.UserId);
        builder.HasIndex(x => new { x.UserId, x.Status });
        DesktopSoftDeleteMapping.MapIsDeletedColumn(builder);
    }
}

public class OfflinePlaybackGrantConfig : IEntityTypeConfiguration<OfflinePlaybackGrant>
{
    public void Configure(EntityTypeBuilder<OfflinePlaybackGrant> builder)
    {
        builder.ToTable("OfflinePlaybackGrants", "Desktop");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.TokenJti).HasMaxLength(64).IsRequired();
        builder.Property(x => x.TokenHash).HasMaxLength(128).IsRequired();
        builder.Property(x => x.DeviceId).HasMaxLength(128);
        builder.HasIndex(x => x.TokenJti).IsUnique();
        builder.HasIndex(x => new { x.UserId, x.CourseId, x.ExpiresAtUtc });
        DesktopSoftDeleteMapping.MapIsDeletedColumn(builder);
    }
}

public class DesktopDeviceRegistrationConfig : IEntityTypeConfiguration<DesktopDeviceRegistration>
{
    public void Configure(EntityTypeBuilder<DesktopDeviceRegistration> builder)
    {
        builder.ToTable("DesktopDeviceRegistrations", "Desktop");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.DeviceId).HasMaxLength(128).IsRequired();
        builder.Property(x => x.MachineName).HasMaxLength(200);
        builder.Property(x => x.OsVersion).HasMaxLength(100);
        builder.Property(x => x.AppVersion).HasMaxLength(32);
        builder.Property(x => x.HasActiveLogin).IsRequired().HasDefaultValue(false);
        builder.Property(x => x.ActiveLoginAtUtc);
        builder.HasIndex(x => new { x.UserId, x.DeviceId }).IsUnique();
        builder.HasIndex(x => new { x.UserId, x.HasActiveLogin });
        DesktopSoftDeleteMapping.MapIsDeletedColumn(builder);
    }
}

public class DesktopAccessBlockConfig : IEntityTypeConfiguration<DesktopAccessBlock>
{
    public void Configure(EntityTypeBuilder<DesktopAccessBlock> builder)
    {
        builder.ToTable("DesktopAccessBlocks", "Desktop");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Scope).IsRequired();
        builder.Property(x => x.Reason).HasMaxLength(1000);
        builder.HasIndex(x => new { x.UserId, x.UnblockedAtUtc });
        DesktopSoftDeleteMapping.MapIsDeletedColumn(builder);
    }
}

public class RemoteAssistSessionConfig : IEntityTypeConfiguration<RemoteAssistSession>
{
    public void Configure(EntityTypeBuilder<RemoteAssistSession> builder)
    {
        builder.ToTable("RemoteAssistSessions", "Desktop");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.OneTimeSessionCode).HasMaxLength(32).IsRequired();
        builder.Property(x => x.SessionUsername).HasMaxLength(64).IsRequired().HasDefaultValue("");
        builder.Property(x => x.PasswordHash).HasMaxLength(256).IsRequired();
        builder.Property(x => x.Status).IsRequired();
        builder.Property(x => x.AllowRemoteControl).HasDefaultValue(true);
        builder.Property(x => x.AllowClipboard).HasDefaultValue(false);
        builder.Property(x => x.AllowFileTransfer).HasDefaultValue(false);
        builder.Property(x => x.AllowAudio).HasDefaultValue(false);
        builder.Property(x => x.AllowLockLocalInput).HasDefaultValue(false);
        builder.HasIndex(x => x.OneTimeSessionCode);
        builder.HasIndex(x => x.SessionUsername);
        builder.HasIndex(x => new { x.RequesterUserId, x.Status });
        DesktopSoftDeleteMapping.MapIsDeletedColumn(builder);
    }
}

public class MediaContentKeyConfig : IEntityTypeConfiguration<MediaContentKey>
{
    public void Configure(EntityTypeBuilder<MediaContentKey> builder)
    {
        builder.ToTable("MediaContentKeys", "Desktop");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.KeyId).HasMaxLength(64).IsRequired();
        builder.Property(x => x.ProtectedKeyMaterial).HasMaxLength(512).IsRequired();
        builder.HasIndex(x => x.KeyId).IsUnique();
        builder.HasIndex(x => x.MediaAssetId);
        DesktopSoftDeleteMapping.MapIsDeletedColumn(builder);
    }
}

public class DesktopAppReleaseConfig : IEntityTypeConfiguration<DesktopAppRelease>
{
    public void Configure(EntityTypeBuilder<DesktopAppRelease> builder)
    {
        builder.ToTable("DesktopAppReleases", "Desktop");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Version).HasMaxLength(32).IsRequired();
        builder.Property(x => x.InstallerUrl).HasMaxLength(500).IsRequired();
        builder.Property(x => x.ReleaseNotes).HasMaxLength(4000);
        builder.Property(x => x.MinSupportedVersion).HasMaxLength(32);
        builder.HasIndex(x => x.Version).IsUnique();
        builder.HasIndex(x => new { x.IsPublished, x.PublishedAtUtc });
        DesktopSoftDeleteMapping.MapIsDeletedColumn(builder);
    }
}

public class CourseDesktopWatermarkPolicyConfig : IEntityTypeConfiguration<CourseDesktopWatermarkPolicy>
{
    public void Configure(EntityTypeBuilder<CourseDesktopWatermarkPolicy> builder)
    {
        builder.ToTable("DesktopWatermarkPolicies", "Course");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.TextTemplate).HasMaxLength(500).IsRequired();
        builder.Property(x => x.FontColor).HasMaxLength(32).IsRequired();
        builder.HasIndex(x => x.CourseId).IsUnique();
        DesktopSoftDeleteMapping.MapIsDeletedColumn(builder);
    }
}

public class DesktopLicenseDeviceBindingConfig : IEntityTypeConfiguration<DesktopLicenseDeviceBinding>
{
    public void Configure(EntityTypeBuilder<DesktopLicenseDeviceBinding> builder)
    {
        builder.ToTable("DesktopLicenseDeviceBindings", "Desktop");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.DeviceId).HasMaxLength(128).IsRequired();
        builder.Property(x => x.MachineName).HasMaxLength(200);
        builder.Property(x => x.RevokeReason).HasMaxLength(500);
        builder.HasIndex(x => new { x.EnrollmentId, x.DeviceId });
        builder.HasIndex(x => new { x.EnrollmentId, x.RevokedAtUtc });
        DesktopSoftDeleteMapping.MapIsDeletedColumn(builder);
    }
}

public class DesktopLicenseLessonAccessConfig : IEntityTypeConfiguration<DesktopLicenseLessonAccess>
{
    public void Configure(EntityTypeBuilder<DesktopLicenseLessonAccess> builder)
    {
        builder.ToTable("DesktopLicenseLessonAccess", "Desktop");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.EnrollmentId, x.LessonId }).IsUnique();
        DesktopSoftDeleteMapping.MapIsDeletedColumn(builder);
    }
}

public class TeacherStudentSatisfactionConfig : IEntityTypeConfiguration<TeacherStudentSatisfaction>
{
    public void Configure(EntityTypeBuilder<TeacherStudentSatisfaction> builder)
    {
        builder.ToTable("TeacherStudentRatings", "Desktop");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Note).HasMaxLength(2000);
        builder.HasIndex(x => new { x.EnrollmentId, x.TeacherUserId }).IsUnique();
        builder.HasIndex(x => new { x.CourseId, x.StudentUserId });
        DesktopSoftDeleteMapping.MapIsDeletedColumn(builder);
    }
}

public class DesktopPlaybackEventConfig : IEntityTypeConfiguration<DesktopPlaybackEvent>
{
    public void Configure(EntityTypeBuilder<DesktopPlaybackEvent> builder)
    {
        builder.ToTable("DesktopPlaybackEvents", "Desktop");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.DeviceId).HasMaxLength(128);
        builder.HasIndex(x => new { x.CourseId, x.LessonId, x.CreatedAtUtc });
        builder.HasIndex(x => new { x.UserId, x.CourseId, x.CreatedAtUtc });
        DesktopSoftDeleteMapping.MapIsDeletedColumn(builder);
    }
}
