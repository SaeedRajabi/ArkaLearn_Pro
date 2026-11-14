using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.CalendarEvents;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.CalendarEventsConfigure;

public class CalendarEventParticipantQueryModelConfiguration : IEntityTypeConfiguration<CalendarEventParticipantQueryModel>
{
    public void Configure(EntityTypeBuilder<CalendarEventParticipantQueryModel> builder)
    {
        builder.ToTable("CalendarEventParticipants", "Calendar");
        builder.HasKey(x => x.Id);
    }
}
