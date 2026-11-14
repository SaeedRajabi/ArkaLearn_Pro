using ArkaSoftwarePro.Src.Core.Contracts.CalendarEvents;
using ArkaSoftwarePro.Src.Core.Contracts.CalendarEvents.CalendarEventRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.NotificationSettings;
using ArkaSoftwarePro.Src.Core.Domain.CalendarAggregate.Entities;
using Microsoft.Extensions.Logging;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CalendarEventServices;

public class CalendarEventReminderService(
    INotificationSettingsProvider settingsProvider,
    ICalendarEventCommandRepository calendarEventRepository,
    CalendarEventNotifier calendarEventNotifier,
    ILogger<CalendarEventReminderService> logger)
{
    public async Task ProcessDueRemindersAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var due = await calendarEventRepository.GetDueScheduledRemindersAsync(now, 100, cancellationToken);
        if (due.Count == 0)
            return;

        logger.LogInformation("Processing {Count} due calendar event reminder(s)", due.Count);

        foreach (var scheduled in due)
        {
            try
            {
                var calendarEvent = await calendarEventRepository.GetByIdWithParticipantsAsync(
                    scheduled.CalendarEventId,
                    cancellationToken);

                if (calendarEvent is null || calendarEvent.IsDelete || calendarEvent.StartUtc <= now)
                {
                    scheduled.Cancel();
                    continue;
                }

                if (!calendarEvent.Participants.Any(x => x.UserId == scheduled.UserId))
                {
                    scheduled.Cancel();
                    continue;
                }

                if (await calendarEventRepository.ReminderDispatchExistsAsync(
                        scheduled.CalendarEventId,
                        scheduled.UserId,
                        scheduled.MinutesBefore,
                        cancellationToken))
                {
                    scheduled.MarkSent();
                    continue;
                }

                var delivered = await calendarEventNotifier.SendReminderAsync(
                    calendarEvent,
                    [scheduled.UserId],
                    scheduled.MinutesBefore,
                    cancellationToken);

                if (delivered)
                {
                    scheduled.MarkSent();
                    logger.LogInformation(
                        "Delivered calendar reminder for event {EventId}, user {UserId}, {MinutesBefore} min before",
                        scheduled.CalendarEventId,
                        scheduled.UserId,
                        scheduled.MinutesBefore);
                }
                else
                {
                    logger.LogWarning(
                        "Calendar reminder not completed for event {EventId}, user {UserId}, {MinutesBefore} min before — will retry",
                        scheduled.CalendarEventId,
                        scheduled.UserId,
                        scheduled.MinutesBefore);
                }
            }
            catch (Exception ex)
            {
                logger.LogError(
                    ex,
                    "Failed processing calendar reminder {ReminderId} for event {EventId}, user {UserId}",
                    scheduled.Id,
                    scheduled.CalendarEventId,
                    scheduled.UserId);
            }
        }

        await calendarEventRepository.CommitAsync(cancellationToken);
    }

    public async Task SyncScheduledRemindersForEventAsync(
        CalendarEvent calendarEvent,
        IEnumerable<long> userIds,
        CancellationToken cancellationToken = default)
    {
        var settings = await settingsProvider.GetCurrentAsync(cancellationToken);
        var offsets = CalendarEventReminderSchedule.Parse(settings?.CalendarEventReminderMinutesJson);
        if (offsets.Count == 0)
        {
            logger.LogWarning(
                "No calendar reminder offsets configured — skipping schedule for event {EventId}",
                calendarEvent.Id);
            return;
        }

        var distinctUserIds = userIds.Where(x => x > 0).Distinct().ToList();
        if (distinctUserIds.Count == 0)
            return;

        var now = DateTime.UtcNow;
        if (calendarEvent.StartUtc <= now)
            return;

        var created = 0;
        foreach (var userId in distinctUserIds)
        {
            foreach (var minutesBefore in offsets)
            {
                if (await calendarEventRepository.ReminderDispatchExistsAsync(
                        calendarEvent.Id,
                        userId,
                        minutesBefore,
                        cancellationToken))
                    continue;

                var scheduledAt = calendarEvent.StartUtc.AddMinutes(-minutesBefore);
                await calendarEventRepository.CancelPendingScheduledReminderAsync(
                    calendarEvent.Id,
                    userId,
                    minutesBefore,
                    cancellationToken);

                await calendarEventRepository.AddScheduledReminderAsync(
                    CalendarEventScheduledReminder.Create(
                        calendarEvent.Id,
                        userId,
                        minutesBefore,
                        scheduledAt),
                    cancellationToken);
                created++;
            }
        }

        if (created == 0)
            return;

        await calendarEventRepository.CommitAsync(cancellationToken);
        await ProcessDueRemindersAsync(cancellationToken);

        logger.LogInformation(
            "Synced {Created} calendar reminder row(s) for event {EventId} with {ParticipantCount} participant(s), offsets [{Offsets}]",
            created,
            calendarEvent.Id,
            distinctUserIds.Count,
            string.Join(", ", offsets));
    }

    public Task ScheduleRemindersForEventAsync(
        CalendarEvent calendarEvent,
        IEnumerable<long> userIds,
        CancellationToken cancellationToken = default)
        => SyncScheduledRemindersForEventAsync(calendarEvent, userIds, cancellationToken);

    public Task RescheduleAllRemindersForEventAsync(
        CalendarEvent calendarEvent,
        CancellationToken cancellationToken = default)
    {
        var participantIds = calendarEvent.Participants.Select(x => x.UserId);
        return SyncScheduledRemindersForEventAsync(calendarEvent, participantIds, cancellationToken);
    }

    public async Task RescheduleAllUpcomingEventsAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var events = await calendarEventRepository.GetUpcomingEventsWithParticipantsAsync(now, cancellationToken);
        if (events.Count == 0)
            return;

        logger.LogInformation("Rescheduling calendar reminders for {Count} upcoming event(s)", events.Count);

        foreach (var calendarEvent in events)
        {
            await calendarEventRepository.DeleteReminderDispatchesForEventAsync(calendarEvent.Id, cancellationToken);
            await calendarEventRepository.CancelPendingScheduledRemindersForEventAsync(calendarEvent.Id, cancellationToken);
        }

        await calendarEventRepository.CommitAsync(cancellationToken);

        foreach (var calendarEvent in events)
        {
            var participantIds = calendarEvent.Participants.Select(x => x.UserId).ToList();
            await SyncScheduledRemindersForEventAsync(calendarEvent, participantIds, cancellationToken);
        }
    }
}
