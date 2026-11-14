namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.CalendarEvents;

public class CalendarEventParticipantQueryModel
{
    public long Id { get; set; }
    public long CalendarEventId { get; set; }
    public long UserId { get; set; }
}
