using ArkaSoftwarePro.Src.Core.Domain.CalendarAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.CalendarEventConfigure;

public class CalendarEventParticipantConfiguration : IEntityTypeConfiguration<CalendarEventParticipant>
{
    public void Configure(EntityTypeBuilder<CalendarEventParticipant> builder)
    {
        builder.ToTable("CalendarEventParticipants", "Calendar");
        builder.Property(x => x.UserId).IsRequired();
        builder.HasIndex(x => new { x.CalendarEventId, x.UserId }).IsUnique();
        builder.HasIndex(x => x.UserId);
    }
}
