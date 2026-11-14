using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Commands;
using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.AddRoomFile;
using Extensions.DependentyInjection.Abstractions;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RoomsServices.Commands
{
    public class AddRoomFileCommandHandler(ArkaSoftwareCMPOutServices mafiaOuterServices,
        IRoomCommandRepository roomCommandRepository) : CommandHandler<AddRoomFileCommand, object>(mafiaOuterServices), IScopeLifetime
    {
        public override async Task<CommandResult<object>> Handle(AddRoomFileCommand command)
        {
            try
            {
                var room = await roomCommandRepository.GetWithFilesAsync(command.RoomId);
                if (room == null)
                    return await ResultAsync("Room not found.", Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.NotFound);

                room.AddRoomFile(
                    command.FileType,
                    command.Title,
                    command.Description,
                    command.FileName,
                    command.FileUrl,
                    command.FileSize,
                    command.UploadedByUserId);
                await roomCommandRepository.CommitAsync();

                return await OkAsync(new
                {
                    roomId = command.RoomId,
                    title = command.Title,
                    fileName = command.FileName,
                    fileUrl = command.FileUrl,
                });
            }
            catch (Exception ex)
            {
                return await ResultAsync("Add room file failed: " + ex.Message, Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.Exception);
            }
        }
    }
}
