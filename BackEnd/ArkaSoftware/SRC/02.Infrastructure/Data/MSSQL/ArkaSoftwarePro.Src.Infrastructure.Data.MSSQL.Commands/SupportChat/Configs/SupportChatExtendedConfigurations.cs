using ArkaSoftwarePro.Src.Core.Domain.SupportChatAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.SupportChat.Configs;

public class SupportChatSmsReminderConfig : IEntityTypeConfiguration<SupportChatSmsReminder>
{
    public void Configure(EntityTypeBuilder<SupportChatSmsReminder> builder)
    {
        builder.ToTable("SupportChatSmsReminders", "Support");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.SenderDisplayName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Subject).HasMaxLength(500).IsRequired();
        builder.HasIndex(x => new { x.RecipientUserId, x.ScheduledAtUtc });
        builder.HasIndex(x => new { x.ConversationId, x.RecipientUserId });
    }
}

public class SupportConversationRatingConfig : IEntityTypeConfiguration<SupportConversationRating>
{
    public void Configure(EntityTypeBuilder<SupportConversationRating> builder)
    {
        builder.ToTable("SupportConversationRatings", "Support");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Feedback).HasMaxLength(500);
        builder.HasIndex(x => x.ConversationId).IsUnique();
        builder.HasIndex(x => x.TeacherUserId);
    }
}
