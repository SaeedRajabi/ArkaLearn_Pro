using ArkaSoftwarePro.Src.Core.Domain.CommunityDiscussionAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.CommunityDiscussions.Configs;

public class CommunityThreadConfig : IEntityTypeConfiguration<CommunityThread>
{
    public void Configure(EntityTypeBuilder<CommunityThread> builder)
    {
        builder.ToTable("Threads", "Community");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.UserId).IsRequired();
        builder.Property(x => x.Subject).HasMaxLength(300);
        builder.Property(x => x.ContentHtml).HasColumnType("NVARCHAR(MAX)").IsRequired();
        builder.Property(x => x.AudioUrl).HasMaxLength(500);
        builder.Property(x => x.Slug).HasMaxLength(200);
        builder.Property(x => x.ReplyCount).IsRequired();
        builder.Property(x => x.LikeCount).IsRequired();
        builder.Property(x => x.DislikeCount).IsRequired();
        builder.HasIndex(x => x.UserId);
        builder.HasMany(x => x.Replies).WithOne().HasForeignKey(x => x.ThreadId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class CommunityReplyConfig : IEntityTypeConfiguration<CommunityReply>
{
    public void Configure(EntityTypeBuilder<CommunityReply> builder)
    {
        builder.ToTable("Replies", "Community");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ThreadId).IsRequired();
        builder.Property(x => x.UserId).IsRequired();
        builder.Property(x => x.ContentHtml).HasColumnType("NVARCHAR(MAX)").IsRequired();
        builder.Property(x => x.AudioUrl).HasMaxLength(500);
        builder.Property(x => x.LikeCount).IsRequired();
        builder.HasIndex(x => x.ThreadId);
    }
}

public class CommunityReplyLikeConfig : IEntityTypeConfiguration<CommunityReplyLike>
{
    public void Configure(EntityTypeBuilder<CommunityReplyLike> builder)
    {
        builder.ToTable("ReplyLikes", "Community");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ReplyId).IsRequired();
        builder.Property(x => x.UserId).IsRequired();
        builder.HasIndex(x => new { x.ReplyId, x.UserId }).IsUnique();
    }
}

public class CommunityThreadReactionConfig : IEntityTypeConfiguration<CommunityThreadReaction>
{
    public void Configure(EntityTypeBuilder<CommunityThreadReaction> builder)
    {
        builder.ToTable("ThreadReactions", "Community");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ThreadId).IsRequired();
        builder.Property(x => x.UserId).IsRequired();
        builder.Property(x => x.Reaction).IsRequired();
        builder.HasIndex(x => new { x.ThreadId, x.UserId }).IsUnique();
    }
}

public class CommunityThreadSubscriptionConfig : IEntityTypeConfiguration<CommunityThreadSubscription>
{
    public void Configure(EntityTypeBuilder<CommunityThreadSubscription> builder)
    {
        builder.ToTable("ThreadSubscriptions", "Community");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ThreadId).IsRequired();
        builder.Property(x => x.UserId).IsRequired();
        builder.HasIndex(x => new { x.ThreadId, x.UserId }).IsUnique();
    }
}
