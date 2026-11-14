using ArkaSoftwarePro.Src.Core.Domain.CalendarAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.CalendarEventConfigure;

public class CalendarEventReminderDispatchConfiguration : IEntityTypeConfiguration<CalendarEventReminderDispatch>
{
    public void Configure(EntityTypeBuilder<CalendarEventReminderDispatch> builder)
    {
        builder.ToTable("CalendarEventReminderDispatches", "Calendar");
        builder.Property(x => x.MinutesBefore).IsRequired();
        builder.Property(x => x.SentAtUtc).IsRequired();
        builder.HasIndex(x => new { x.CalendarEventId, x.UserId, x.MinutesBefore }).IsUnique();
    }
}
