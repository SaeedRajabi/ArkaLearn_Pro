using ArkaSoftwarePro.Src.Core.Contracts.CalendarEvents.CalendarEventRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.CalendarAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.CalendarEvents.Repositories;

public class CalendarEventCommandRepository(ArkaSoftwareCommandDbContext dbContext)
    : BaseCommandRepository<CalendarEvent, ArkaSoftwareCommandDbContext>(dbContext), ICalendarEventCommandRepository
{
    public Task<CalendarEvent?> GetByIdWithParticipantsAsync(long id, CancellationToken cancellationToken = default) =>
        _dbContext.CalendarEvents
            .Include(x => x.Participants)
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDelete, cancellationToken);

    public Task<List<CalendarEvent>> GetByRangeAsync(
        DateTime rangeStartUtc,
        DateTime rangeEndUtc,
        IReadOnlyCollection<int>? categories,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.CalendarEvents
            .AsNoTracking()
            .Include(x => x.Participants)
            .Where(x => !x.IsDelete && x.EndUtc >= rangeStartUtc && x.StartUtc <= rangeEndUtc);

        if (categories is { Count: > 0 })
            query = query.Where(x => categories.Contains((int)x.Category));

        return query.OrderBy(x => x.StartUtc).ToListAsync(cancellationToken);
    }

    public Task<List<CalendarEventReminderDispatch>> GetReminderDispatchesAsync(
        long eventId,
        CancellationToken cancellationToken = default) =>
        _dbContext.CalendarEventReminderDispatches
            .AsNoTracking()
            .Where(x => x.CalendarEventId == eventId)
            .ToListAsync(cancellationToken);

    public async Task AddReminderDispatchAsync(
        CalendarEventReminderDispatch dispatch,
        CancellationToken cancellationToken = default)
    {
        await _dbContext.CalendarEventReminderDispatches.AddAsync(dispatch, cancellationToken);
    }

    public Task<bool> ReminderDispatchExistsAsync(
        long eventId,
        long userId,
        int minutesBefore,
        CancellationToken cancellationToken = default) =>
        _dbContext.CalendarEventReminderDispatches.AnyAsync(
            x => x.CalendarEventId == eventId && x.UserId == userId && x.MinutesBefore == minutesBefore,
            cancellationToken);

    public Task<List<CalendarEvent>> GetUpcomingForRemindersAsync(
        DateTime windowStartUtc,
        DateTime windowEndUtc,
        CancellationToken cancellationToken = default) =>
        _dbContext.CalendarEvents
            .AsNoTracking()
            .Include(x => x.Participants)
            .Where(x => !x.IsDelete && x.StartUtc >= windowStartUtc && x.StartUtc <= windowEndUtc)
            .ToListAsync(cancellationToken);

    public async Task DeleteReminderDispatchesForEventAsync(
        long eventId,
        CancellationToken cancellationToken = default)
    {
        var dispatches = await _dbContext.CalendarEventReminderDispatches
            .Where(x => x.CalendarEventId == eventId)
            .ToListAsync(cancellationToken);

        if (dispatches.Count == 0)
            return;

        _dbContext.CalendarEventReminderDispatches.RemoveRange(dispatches);
    }

    public async Task AddScheduledReminderAsync(
        CalendarEventScheduledReminder reminder,
        CancellationToken cancellationToken = default)
    {
        await _dbContext.CalendarEventScheduledReminders.AddAsync(reminder, cancellationToken);
    }

    public async Task CancelPendingScheduledRemindersForEventAsync(
        long eventId,
        CancellationToken cancellationToken = default)
    {
        var pending = await _dbContext.CalendarEventScheduledReminders
            .Where(x =>
                x.CalendarEventId == eventId &&
                x.SentAtUtc == null &&
                x.CancelledAtUtc == null)
            .ToListAsync(cancellationToken);

        foreach (var item in pending)
            item.Cancel();
    }

    public async Task CancelPendingScheduledReminderAsync(
        long eventId,
        long userId,
        int minutesBefore,
        CancellationToken cancellationToken = default)
    {
        var pending = await _dbContext.CalendarEventScheduledReminders
            .Where(x =>
                x.CalendarEventId == eventId &&
                x.UserId == userId &&
                x.MinutesBefore == minutesBefore &&
                x.SentAtUtc == null &&
                x.CancelledAtUtc == null)
            .ToListAsync(cancellationToken);

        foreach (var item in pending)
            item.Cancel();
    }

    public Task<List<CalendarEventScheduledReminder>> GetDueScheduledRemindersAsync(
        DateTime utcNow,
        int take,
        CancellationToken cancellationToken = default)
    {
        take = take is > 0 and <= 200 ? take : 50;
        return _dbContext.CalendarEventScheduledReminders
            .Where(x =>
                x.ScheduledAtUtc <= utcNow &&
                x.SentAtUtc == null &&
                x.CancelledAtUtc == null)
            .OrderBy(x => x.ScheduledAtUtc)
            .Take(take)
            .ToListAsync(cancellationToken);
    }

    public Task<List<CalendarEvent>> GetUpcomingEventsWithParticipantsAsync(
        DateTime utcNow,
        CancellationToken cancellationToken = default) =>
        _dbContext.CalendarEvents
            .Include(x => x.Participants)
            .Where(x => !x.IsDelete && x.StartUtc > utcNow && x.Participants.Any())
            .OrderBy(x => x.StartUtc)
            .ToListAsync(cancellationToken);

    public Task CommitAsync(CancellationToken cancellationToken = default) =>
        _dbContext.SaveChangesAsync(cancellationToken);
}
