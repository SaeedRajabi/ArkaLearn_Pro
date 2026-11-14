using ArkaSoftwarePro.Src.Core.Domain.DashboardAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Dashboard.Configs;

public class SupportTicketMessageConfig : IEntityTypeConfiguration<SupportTicketMessage>
{
    public void Configure(EntityTypeBuilder<SupportTicketMessage> builder)
    {
        builder.ToTable("SupportTicketMessages");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.TicketId).IsRequired();
        builder.Property(x => x.SenderUserId).IsRequired();
        builder.Property(x => x.IsStaffMessage).HasDefaultValue(false);
        builder.Property(x => x.ContentHtml).HasColumnType("NVARCHAR(MAX)").IsRequired();
        builder.Property(x => x.SentAtUtc).IsRequired();
        builder.Property(x => x.ReplyToMessageId).IsRequired(false);
        builder.Property(x => x.EditedAtUtc).IsRequired(false);
        builder.HasIndex(x => x.TicketId);
        builder.HasIndex(x => new { x.TicketId, x.SentAtUtc });
    }
}
