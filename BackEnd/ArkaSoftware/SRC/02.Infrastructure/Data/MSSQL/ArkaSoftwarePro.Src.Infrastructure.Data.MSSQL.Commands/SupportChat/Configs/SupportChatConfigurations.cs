using ArkaSoftwarePro.Src.Core.Domain.SupportChatAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.SupportChat.Configs;

public class SupportConversationConfig : IEntityTypeConfiguration<SupportConversation>
{
    public void Configure(EntityTypeBuilder<SupportConversation> builder)
    {
        builder.ToTable("SupportConversations", "Support");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.StudentUserId).IsRequired();
        builder.Property(x => x.TeacherUserId).IsRequired();
        builder.Property(x => x.Subject).HasMaxLength(500).IsRequired();
        builder.Property(x => x.Status).IsRequired();
        builder.Property(x => x.CreatedAtUtc).IsRequired();
        builder.Property(x => x.IsDesktopEnabled).HasDefaultValue(true);
        builder.HasIndex(x => x.StudentUserId);
        builder.HasIndex(x => x.TeacherUserId);
        builder.HasIndex(x => new { x.StudentUserId, x.TeacherUserId, x.CreatedAtUtc });
        builder.HasMany(x => x.Messages).WithOne().HasForeignKey(x => x.ConversationId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class SupportMessageConfig : IEntityTypeConfiguration<SupportMessage>
{
    public void Configure(EntityTypeBuilder<SupportMessage> builder)
    {
        builder.ToTable("SupportMessages", "Support");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ConversationId).IsRequired();
        builder.Property(x => x.SenderUserId).IsRequired();
        builder.Property(x => x.IsStaffMessage).HasDefaultValue(false);
        builder.Property(x => x.ContentHtml).HasColumnType("NVARCHAR(MAX)").IsRequired();
        builder.Property(x => x.SentAtUtc).IsRequired();
        builder.Property(x => x.DeliveredAtUtc).IsRequired(false);
        builder.Property(x => x.SeenAtUtc).IsRequired(false);
        builder.Property(x => x.ReplyToMessageId).IsRequired(false);
        builder.Property(x => x.EditedAtUtc).IsRequired(false);
        builder.Property(x => x.ClientMessageId).HasMaxLength(64);
        builder.Property(x => x.AttachmentUrl).HasMaxLength(500);
        builder.Property(x => x.AttachmentFileName).HasMaxLength(260);
        builder.Property(x => x.AttachmentContentType).HasMaxLength(100);
        builder.Property(x => x.AttachmentUploadSessionId).HasMaxLength(64);
        builder.HasIndex(x => x.ConversationId);
        builder.HasIndex(x => new { x.ConversationId, x.SentAtUtc });
        builder.HasIndex(x => x.ReplyToMessageId);
        builder.HasIndex(x => x.ClientMessageId);
    }
}
