using ArkaSoftwarePro.Src.Core.Domain.CalendarAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.CalendarEventConfigure;

public class CalendarEventScheduledReminderConfiguration : IEntityTypeConfiguration<CalendarEventScheduledReminder>
{
    public void Configure(EntityTypeBuilder<CalendarEventScheduledReminder> builder)
    {
        builder.ToTable("CalendarEventScheduledReminders", "Calendar");
        builder.Property(x => x.CalendarEventId).IsRequired();
        builder.Property(x => x.UserId).IsRequired();
        builder.Property(x => x.MinutesBefore).IsRequired();
        builder.Property(x => x.ScheduledAtUtc).IsRequired();
        builder.HasIndex(x => new { x.ScheduledAtUtc, x.SentAtUtc, x.CancelledAtUtc });
        builder.HasIndex(x => new { x.CalendarEventId, x.UserId, x.MinutesBefore });
    }
}
