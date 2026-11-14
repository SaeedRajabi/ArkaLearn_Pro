using ArkaSoftwarePro.Src.Core.ApplicationService.CalendarEventServices;
using ArkaSoftwarePro.Src.Core.Contracts.CalendarEvents.CalendarEventRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.CalendarAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.CalendarEvents.Commands.UpdateCalendarEvent;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CalendarEventServices.Commands;

public class UpdateCalendarEventCommandHandler(
    ArkaSoftwareCMPOutServices outerServices,
    ICalendarEventCommandRepository calendarEventRepository,
    CalendarEventNotifier calendarEventNotifier,
    CalendarEventReminderService calendarEventReminderService)
    : CommandHandler<UpdateCalendarEventCommand, bool>(outerServices)
{
    public override async Task<CommandResult<bool>> Handle(UpdateCalendarEventCommand command)
    {
        var calendarEvent = await calendarEventRepository.GetByIdWithParticipantsAsync(command.EventId);
        if (calendarEvent is null)
            return await ResultAsync(false, ApplicationServiceStatus.NotFound);

        command.Title = (command.Title ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(command.Title))
        {
            AddMessage("Title is required.");
            return await ResultAsync(false, ApplicationServiceStatus.ValidationError);
        }

        if (!Enum.IsDefined(typeof(CalendarEventCategory), command.Category))
        {
            AddMessage("Invalid category.");
            return await ResultAsync(false, ApplicationServiceStatus.ValidationError);
        }

        var previousParticipantIds = calendarEvent.Participants.Select(x => x.UserId).ToHashSet();
        var previousStartUtc = calendarEvent.StartUtc;

        try
        {
            calendarEvent.Update(
                command.Title,
                (CalendarEventCategory)command.Category,
                command.StartUtc,
                command.EndUtc,
                command.IsAllDay,
                command.EventUrl,
                command.Description,
                command.ParticipantUserIds);
        }
        catch (ArgumentException ex)
        {
            AddMessage(ex.Message);
            return await ResultAsync(false, ApplicationServiceStatus.ValidationError);
        }

        var startTimeChanged = previousStartUtc != calendarEvent.StartUtc;
        if (startTimeChanged)
        {
            await calendarEventRepository.DeleteReminderDispatchesForEventAsync(calendarEvent.Id);
            await calendarEventRepository.CancelPendingScheduledRemindersForEventAsync(calendarEvent.Id);
        }

        await calendarEventRepository.CommitAsync();

        var newParticipantIds = calendarEvent.Participants
            .Select(x => x.UserId)
            .Where(x => !previousParticipantIds.Contains(x))
            .ToList();

        if (newParticipantIds.Count > 0)
            await calendarEventNotifier.NotifyAssignedInAppAsync(calendarEvent, newParticipantIds);

        if (calendarEvent.Participants.Count > 0)
            await calendarEventReminderService.RescheduleAllRemindersForEventAsync(calendarEvent);

        return await OkAsync(true);
    }
}
