using ArkaSoftwarePro.Src.Core.ApplicationService.CalendarEventServices;
using ArkaSoftwarePro.Src.Core.Contracts.CalendarEvents;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CalendarEventServices;

public class CalendarEventReminderScheduler(CalendarEventReminderService reminderService)
    : ICalendarEventReminderScheduler
{
    public Task ProcessDueRemindersAsync(CancellationToken cancellationToken = default)
        => reminderService.ProcessDueRemindersAsync(cancellationToken);
}
