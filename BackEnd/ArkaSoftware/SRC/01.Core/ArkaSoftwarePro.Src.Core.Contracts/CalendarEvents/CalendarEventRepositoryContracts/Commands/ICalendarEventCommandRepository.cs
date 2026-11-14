using ArkaSoftwarePro.Src.Core.Domain.CalendarAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.CalendarEvents.CalendarEventRepositoryContracts.Commands;

public interface ICalendarEventCommandRepository : ICommandRepository<CalendarEvent, long>
{
    Task<CalendarEvent?> GetByIdWithParticipantsAsync(long id, CancellationToken cancellationToken = default);

    Task<List<CalendarEvent>> GetByRangeAsync(
        DateTime rangeStartUtc,
        DateTime rangeEndUtc,
        IReadOnlyCollection<int>? categories,
        CancellationToken cancellationToken = default);

    Task<List<CalendarEventReminderDispatch>> GetReminderDispatchesAsync(
        long eventId,
        CancellationToken cancellationToken = default);

    Task AddReminderDispatchAsync(CalendarEventReminderDispatch dispatch, CancellationToken cancellationToken = default);

    Task<bool> ReminderDispatchExistsAsync(
        long eventId,
        long userId,
        int minutesBefore,
        CancellationToken cancellationToken = default);

    Task<List<CalendarEvent>> GetUpcomingForRemindersAsync(
        DateTime windowStartUtc,
        DateTime windowEndUtc,
        CancellationToken cancellationToken = default);

    Task DeleteReminderDispatchesForEventAsync(long eventId, CancellationToken cancellationToken = default);

    Task AddScheduledReminderAsync(
        CalendarEventScheduledReminder reminder,
        CancellationToken cancellationToken = default);

    Task CancelPendingScheduledRemindersForEventAsync(
        long eventId,
        CancellationToken cancellationToken = default);

    Task CancelPendingScheduledReminderAsync(
        long eventId,
        long userId,
        int minutesBefore,
        CancellationToken cancellationToken = default);

    Task<List<CalendarEventScheduledReminder>> GetDueScheduledRemindersAsync(
        DateTime utcNow,
        int take,
        CancellationToken cancellationToken = default);

    Task<List<CalendarEvent>> GetUpcomingEventsWithParticipantsAsync(
        DateTime utcNow,
        CancellationToken cancellationToken = default);

    Task CommitAsync(CancellationToken cancellationToken = default);
}
