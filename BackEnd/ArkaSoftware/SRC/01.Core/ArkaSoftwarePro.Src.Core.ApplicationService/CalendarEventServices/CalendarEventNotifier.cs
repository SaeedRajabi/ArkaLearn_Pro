using ArkaSoftwarePro.Src.Core.Contracts.CalendarEvents.CalendarEventRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Engagement;
using ArkaSoftwarePro.Src.Core.Contracts.NotificationSettings;
using ArkaSoftwarePro.Src.Core.Contracts.Sms;
using ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.CalendarAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UserNotificationAggregate.Entities;
using Microsoft.Extensions.Logging;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CalendarEventServices;

public class CalendarEventNotifier(
    IUserNotificationCommandRepository notificationRepository,
    IEngagementRealtimeNotifier engagementRealtime,
    ISmsNotificationService smsNotificationService,
    INotificationSettingsProvider settingsProvider,
    ICalendarEventCommandRepository calendarEventRepository,
    ILogger<CalendarEventNotifier> logger)
{
    public async Task NotifyAssignedInAppAsync(
        CalendarEvent calendarEvent,
        IEnumerable<long> userIds,
        CancellationToken cancellationToken = default)
    {
        var distinctUserIds = userIds.Where(x => x > 0).Distinct().ToList();
        if (distinctUserIds.Count == 0)
            return;

        var schedule = CalendarEventScheduleFormatter.Format(calendarEvent.StartUtc, calendarEvent.IsAllDay);
        var body =
            $"شما به رویداد «{calendarEvent.Title}» در تاریخ {schedule.Date}، ساعت {schedule.Time} دعوت شده‌اید.";

        foreach (var userId in distinctUserIds)
        {
            await notificationRepository.InsertAsync(UserNotification.Create(
                userId,
                "دعوت به رویداد",
                body,
                "calendar_event",
                "/account?view=calendar",
                calendarEvent.Id));
        }

        await notificationRepository.CommitAsync();
        foreach (var userId in distinctUserIds)
            await engagementRealtime.NotifyUserNotificationAsync(userId);
    }

    /// <returns>true when reminder delivery completed (in-app + SMS when enabled).</returns>
    public async Task<bool> SendReminderAsync(
        CalendarEvent calendarEvent,
        IEnumerable<long> userIds,
        int minutesBefore,
        CancellationToken cancellationToken = default)
    {
        var distinctUserIds = userIds.Where(x => x > 0).Distinct().ToList();
        if (distinctUserIds.Count == 0 || minutesBefore <= 0)
            return true;

        var settings = await settingsProvider.GetCurrentAsync(cancellationToken);
        var smsExpected = settings is { CalendarEventSmsEnabled: true, CanSendSms: true };

        var sentAtUtc = DateTime.UtcNow;
        var schedule = CalendarEventScheduleFormatter.Format(calendarEvent.StartUtc, calendarEvent.IsAllDay);
        var body =
            $"یادآوری: رویداد «{calendarEvent.Title}» در تاریخ {schedule.Date}، ساعت {schedule.Time} (حدود {minutesBefore} دقیقه دیگر).";

        var allDelivered = true;

        foreach (var userId in distinctUserIds)
        {
            if (await calendarEventRepository.ReminderDispatchExistsAsync(
                    calendarEvent.Id,
                    userId,
                    minutesBefore,
                    cancellationToken))
                continue;

            await notificationRepository.InsertAsync(UserNotification.Create(
                userId,
                "یادآور رویداد",
                body,
                "calendar_event",
                "/account?view=calendar",
                calendarEvent.Id));

            var smsSent = await smsNotificationService.TrySendCalendarEventReminderAsync(
                userId,
                calendarEvent.Title,
                calendarEvent.StartUtc,
                calendarEvent.IsAllDay,
                minutesBefore,
                cancellationToken);

            if (smsExpected && !smsSent)
            {
                logger.LogWarning(
                    "Calendar SMS not sent for event {EventId}, user {UserId}, {MinutesBefore} min before",
                    calendarEvent.Id,
                    userId,
                    minutesBefore);
                allDelivered = false;
                continue;
            }

            await calendarEventRepository.AddReminderDispatchAsync(
                CalendarEventReminderDispatch.Create(
                    calendarEvent.Id,
                    userId,
                    minutesBefore,
                    sentAtUtc),
                cancellationToken);
        }

        await notificationRepository.CommitAsync();
        await calendarEventRepository.CommitAsync();

        foreach (var userId in distinctUserIds)
            await engagementRealtime.NotifyUserNotificationAsync(userId);

        return allDelivered;
    }
}
