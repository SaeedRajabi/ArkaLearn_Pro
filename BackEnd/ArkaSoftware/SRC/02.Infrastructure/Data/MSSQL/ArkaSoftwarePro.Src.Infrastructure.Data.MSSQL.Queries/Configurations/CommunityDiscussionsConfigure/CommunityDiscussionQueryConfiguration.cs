using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.CommunityDiscussions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.CommunityDiscussionsConfigure;

public class CommunityThreadQueryConfiguration : IEntityTypeConfiguration<CommunityThreadQueryModel>
{
    public void Configure(EntityTypeBuilder<CommunityThreadQueryModel> builder)
    {
        builder.ToTable("Threads", "Community");
        builder.HasKey(x => x.Id);
        builder.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.NoAction);
        builder.HasMany(x => x.Replies).WithOne().HasForeignKey(x => x.ThreadId);
    }
}

public class CommunityReplyQueryConfiguration : IEntityTypeConfiguration<CommunityReplyQueryModel>
{
    public void Configure(EntityTypeBuilder<CommunityReplyQueryModel> builder)
    {
        builder.ToTable("Replies", "Community");
        builder.HasKey(x => x.Id);
        builder.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.NoAction);
    }
}

public class CommunityReplyLikeQueryConfiguration : IEntityTypeConfiguration<CommunityReplyLikeQueryModel>
{
    public void Configure(EntityTypeBuilder<CommunityReplyLikeQueryModel> builder)
    {
        builder.ToTable("ReplyLikes", "Community");
        builder.HasKey(x => x.Id);
    }
}

public class CommunityThreadReactionQueryConfiguration : IEntityTypeConfiguration<CommunityThreadReactionQueryModel>
{
    public void Configure(EntityTypeBuilder<CommunityThreadReactionQueryModel> builder)
    {
        builder.ToTable("ThreadReactions", "Community");
        builder.HasKey(x => x.Id);
    }
}

public class CommunityThreadSubscriptionQueryConfiguration : IEntityTypeConfiguration<CommunityThreadSubscriptionQueryModel>
{
    public void Configure(EntityTypeBuilder<CommunityThreadSubscriptionQueryModel> builder)
    {
        builder.ToTable("ThreadSubscriptions", "Community");
        builder.HasKey(x => x.Id);
    }
}
