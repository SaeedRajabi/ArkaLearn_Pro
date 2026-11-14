namespace ArkaSoftwarePro.Src.Core.Contracts.CalendarEvents;

public interface ICalendarEventReminderScheduler
{
    Task ProcessDueRemindersAsync(CancellationToken cancellationToken = default);
}
