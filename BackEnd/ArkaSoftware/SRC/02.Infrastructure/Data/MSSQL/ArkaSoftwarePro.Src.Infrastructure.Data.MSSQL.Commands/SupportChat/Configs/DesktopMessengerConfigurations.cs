using ArkaSoftwarePro.Src.Core.Domain.SupportChatAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.SupportChat.Configs;

public class SupportTeacherStoryConfig : IEntityTypeConfiguration<SupportTeacherStory>
{
    public void Configure(EntityTypeBuilder<SupportTeacherStory> builder)
    {
        builder.ToTable("SupportTeacherStories", "Support");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.TeacherUserId).IsRequired();
        builder.Property(x => x.Caption).HasMaxLength(1000);
        builder.Property(x => x.MediaUrl).HasMaxLength(500);
        builder.Property(x => x.ThumbnailUrl).HasMaxLength(500);
        builder.Property(x => x.MediaKind).HasConversion<int>().IsRequired();
        builder.Property(x => x.DurationSeconds).IsRequired();
        builder.Property(x => x.CreatedAtUtc).IsRequired();
        builder.Property(x => x.ExpiresAtUtc).IsRequired();
        builder.HasIndex(x => new { x.TeacherUserId, x.ExpiresAtUtc });
        builder.HasMany(x => x.Views).WithOne().HasForeignKey(x => x.StoryId).OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(x => x.Views).HasField("_views").UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}

public class SupportTeacherStoryViewConfig : IEntityTypeConfiguration<SupportTeacherStoryView>
{
    public void Configure(EntityTypeBuilder<SupportTeacherStoryView> builder)
    {
        builder.ToTable("SupportTeacherStoryViews", "Support");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.StoryId).IsRequired();
        builder.Property(x => x.ViewerUserId).IsRequired();
        builder.Property(x => x.ViewedAtUtc).IsRequired();
        builder.HasIndex(x => new { x.StoryId, x.ViewerUserId }).IsUnique();
    }
}

public class DesktopUserPresenceConfig : IEntityTypeConfiguration<DesktopUserPresence>
{
    public void Configure(EntityTypeBuilder<DesktopUserPresence> builder)
    {
        builder.ToTable("DesktopUserPresences", "Support");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.UserId).IsRequired();
        builder.Property(x => x.ConnectionId).HasMaxLength(128);
        builder.Property(x => x.Status).HasMaxLength(32).IsRequired();
        builder.Property(x => x.AppVersion).HasMaxLength(32);
        builder.Property(x => x.DeviceId).HasMaxLength(128);
        builder.Property(x => x.LastSeenAtUtc).IsRequired();
        builder.HasIndex(x => x.UserId).IsUnique();
        builder.HasIndex(x => x.Status);
    }
}
