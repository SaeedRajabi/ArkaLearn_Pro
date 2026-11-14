using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Services;
using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.UpdateRoom;
using Extensions.DependentyInjection.Abstractions;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.Extensions.Configuration;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RoomsServices.Commands
{
    public class UpdateRoomCommandHandler(ArkaSoftwareCMPOutServices mafiaOuterServices,
        IRoomCommandRepository roomCommandRepository,
        IEntityTitleUniquenessChecker titleUniquenessChecker,
        IConfiguration configuration) : CommandHandler<UpdateRoomCommand, object>(mafiaOuterServices), IScopeLifetime
    {
        public override async Task<CommandResult<object>> Handle(UpdateRoomCommand command)
        {
            try
            {
                var room = await roomCommandRepository.GetAsync(command.RoomId);
                if (room == null)
                    return await ResultAsync("Room not found.", Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.NotFound);

                if (await titleUniquenessChecker.RoomTitleExistsAsync(command.Title ?? string.Empty, command.RoomId))
                {
                    AddMessage("A room with this title already exists.");
                    return await ResultAsync(string.Empty, Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.Exist);
                }

                var fallbackOrigin = configuration["RoomDashboard:BaseUrl"]?.Trim() ?? "https://admin-dashboard.arkasoftware.ir";
                var normalizedBaseUrl = string.IsNullOrWhiteSpace(command.BaseUrl)
                    ? fallbackOrigin
                    : RoomEntryLinkBuilder.NormalizeOrigin(command.BaseUrl);

                room.Update(
                    command.Title,
                    command.RoomCapacity,
                    command.Slug,
                    normalizedBaseUrl,
                    command.IsGuest,
                    command.GuestQuantity,
                    command.Status,
                    command.MaxSessionTime,
                    command.DefaultMediaFileId,
                    command.DefaultSlideFileId,
                    command.TeacherEntersFirst
                );
                await roomCommandRepository.CommitAsync();

                var roomLink = RoomEntryLinkBuilder.Normalize(room.ClassRoomLink?.Link, room.Slug, normalizedBaseUrl);
                return await OkAsync(new
                {
                    roomId = room.Id,
                    title = room.Title,
                    slug = room.Slug,
                    roomLink
                });
            }
            catch (Exception)
            {
                return await ResultAsync("Update Room failed.", Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.Exception);
            }
        }
    }
}
