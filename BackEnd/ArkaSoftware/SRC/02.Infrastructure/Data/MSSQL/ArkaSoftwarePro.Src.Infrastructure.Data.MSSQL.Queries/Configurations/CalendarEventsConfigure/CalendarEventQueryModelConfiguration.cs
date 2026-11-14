using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.CalendarEvents;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.CalendarEventsConfigure;

public class CalendarEventQueryModelConfiguration : IEntityTypeConfiguration<CalendarEventQueryModel>
{
    public void Configure(EntityTypeBuilder<CalendarEventQueryModel> builder)
    {
        builder.ToTable("CalendarEvents", "Calendar");
        builder.HasKey(x => x.Id);
    }
}
