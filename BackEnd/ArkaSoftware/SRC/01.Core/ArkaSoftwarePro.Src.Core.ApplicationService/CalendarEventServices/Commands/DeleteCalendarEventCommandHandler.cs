using ArkaSoftwarePro.Src.Core.Contracts.CalendarEvents.CalendarEventRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.CalendarEvents.Commands.DeleteCalendarEvent;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CalendarEventServices.Commands;

public class DeleteCalendarEventCommandHandler(
    ArkaSoftwareCMPOutServices outerServices,
    ICalendarEventCommandRepository calendarEventRepository)
    : CommandHandler<DeleteCalendarEventCommand, bool>(outerServices)
{
    public override async Task<CommandResult<bool>> Handle(DeleteCalendarEventCommand command)
    {
        var calendarEvent = await calendarEventRepository.GetByIdWithParticipantsAsync(command.EventId);
        if (calendarEvent is null)
            return await ResultAsync(false, ApplicationServiceStatus.NotFound);

        calendarEvent.Remove();
        await calendarEventRepository.CommitAsync();
        return await OkAsync(true);
    }
}
