using ArkaSoftwarePro.Src.Core.ApplicationService.CalendarEventServices;
using ArkaSoftwarePro.Src.Core.Contracts.CalendarEvents.CalendarEventRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.CalendarAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.CalendarAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.CalendarEvents.Commands.SaveCalendarEvent;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CalendarEventServices.Commands;

public class SaveCalendarEventCommandHandler(
    ArkaSoftwareCMPOutServices outerServices,
    ICalendarEventCommandRepository calendarEventRepository,
    CalendarEventNotifier calendarEventNotifier,
    CalendarEventReminderService calendarEventReminderService,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<SaveCalendarEventCommand, string>(outerServices)
{
    public override async Task<CommandResult<string>> Handle(SaveCalendarEventCommand command)
    {
        var userIdClaim = httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !long.TryParse(userIdClaim, out var ownerUserId))
            return await ResultAsync(string.Empty, ApplicationServiceStatus.NotFound);

        command.Title = (command.Title ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(command.Title))
        {
            AddMessage("Title is required.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        if (!Enum.IsDefined(typeof(CalendarEventCategory), command.Category))
        {
            AddMessage("Invalid category.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        var requestedOccurrences = command.Occurrences.Count > 0
            ? command.Occurrences
                .GroupBy(x => new { x.StartUtc, x.EndUtc })
                .Select(x => x.First())
                .ToList()
            :
            [
                new SaveCalendarEventOccurrence
                {
                    StartUtc = command.StartUtc,
                    EndUtc = command.EndUtc
                }
            ];

        if (requestedOccurrences.Count > 366)
        {
            AddMessage("A maximum of 366 event occurrences can be created at once.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        var calendarEvents = new List<CalendarEvent>(requestedOccurrences.Count);
        try
        {
            foreach (var occurrence in requestedOccurrences.OrderBy(x => x.StartUtc))
            {
                calendarEvents.Add(CalendarEvent.Create(
                    command.Title,
                    (CalendarEventCategory)command.Category,
                    occurrence.StartUtc,
                    occurrence.EndUtc,
                    command.IsAllDay,
                    command.EventUrl,
                    command.Description,
                    ownerUserId,
                    command.ParticipantUserIds));
            }
        }
        catch (ArgumentException ex)
        {
            AddMessage(ex.Message);
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        foreach (var calendarEvent in calendarEvents)
            await calendarEventRepository.InsertAsync(calendarEvent);
        await calendarEventRepository.CommitAsync();

        foreach (var calendarEvent in calendarEvents.Where(x => x.Participants.Count > 0))
        {
            var participantIds = calendarEvent.Participants.Select(x => x.UserId).ToList();
            await calendarEventNotifier.NotifyAssignedInAppAsync(calendarEvent, participantIds);
            await calendarEventReminderService.ScheduleRemindersForEventAsync(calendarEvent, participantIds);
        }

        return await OkAsync(string.Join(',', calendarEvents.Select(x => x.Id)));
    }
}
