using ArkaSoftwarePro.Src.Core.Domain.DashboardAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Dashboard.Configs;

public class SupportTicketConfig : IEntityTypeConfiguration<SupportTicket>
{
    public void Configure(EntityTypeBuilder<SupportTicket> builder)
    {
        builder.ToTable("SupportTickets");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.DisplayNumber).IsRequired();
        builder.Property(x => x.TicketSource).HasMaxLength(20).IsRequired().HasDefaultValue("Contact");
        builder.Property(x => x.Department).HasMaxLength(50).IsRequired().HasDefaultValue("");
        builder.Property(x => x.RequesterUserId).IsRequired(false);
        builder.Property(x => x.FirstViewedAtUtc).IsRequired(false);
        builder.Property(x => x.FirstViewedByUserId).IsRequired(false);
        builder.Property(x => x.ClosedAtUtc).IsRequired(false);
        builder.Property(x => x.Rating).IsRequired(false);
        builder.Property(x => x.RatingComment).HasMaxLength(1000).IsRequired(false);
        builder.Property(x => x.LastMessageAtUtc).IsRequired(false);
        builder.Property(x => x.LastMessagePreview).HasMaxLength(200).IsRequired(false);
        builder.HasIndex(x => x.RequesterUserId);
        builder.HasIndex(x => x.TicketSource);
        builder.HasIndex(x => new { x.TicketSource, x.Status, x.LastMessageAtUtc });
        builder.HasMany(x => x.Messages).WithOne().HasForeignKey(x => x.TicketId).OnDelete(DeleteBehavior.Cascade);
        builder.Property(x => x.Subject).HasMaxLength(300).IsRequired();
        builder.Property(x => x.Message).HasColumnType("NVARCHAR(MAX)").IsRequired();
        builder.Property(x => x.Status).HasMaxLength(50).IsRequired();
        builder.Property(x => x.RequesterName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.RequesterEmail).HasMaxLength(320).IsRequired();
        builder.Property(x => x.RequesterAvatarUrl).HasMaxLength(600);
        builder.Property(x => x.AdminReply).HasColumnType("NVARCHAR(MAX)");
        builder.Property(x => x.RepliedAt);
        builder.Property(x => x.RepliedByUserId);
    }
}
