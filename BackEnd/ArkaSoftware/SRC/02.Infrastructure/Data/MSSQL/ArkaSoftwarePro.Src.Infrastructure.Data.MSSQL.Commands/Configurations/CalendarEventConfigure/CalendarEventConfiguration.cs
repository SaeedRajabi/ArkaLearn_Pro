using ArkaSoftwarePro.Src.Core.Domain.CalendarAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.CalendarEventConfigure;

public class CalendarEventConfiguration : IEntityTypeConfiguration<CalendarEvent>
{
    public void Configure(EntityTypeBuilder<CalendarEvent> builder)
    {
        builder.ToTable("CalendarEvents", "Calendar");
        builder.Property(x => x.Title).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Category).IsRequired();
        builder.Property(x => x.StartUtc).IsRequired();
        builder.Property(x => x.EndUtc).IsRequired();
        builder.Property(x => x.IsAllDay).HasDefaultValue(false);
        builder.Property(x => x.EventUrl).HasMaxLength(500);
        builder.Property(x => x.Description).HasMaxLength(4000);

        builder.HasMany(x => x.Participants)
            .WithOne(x => x.CalendarEvent)
            .HasForeignKey(x => x.CalendarEventId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.IsDelete, x.StartUtc, x.EndUtc });
        builder.HasIndex(x => x.OwnerUserId);
    }
}
