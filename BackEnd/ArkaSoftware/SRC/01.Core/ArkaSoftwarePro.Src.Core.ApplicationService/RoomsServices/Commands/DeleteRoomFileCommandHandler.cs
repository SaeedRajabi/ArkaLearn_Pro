using ArkaSoftwarePro.Src.Core.Contracts.FileStorage;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.DeleteRoomFile;
using Extensions.DependentyInjection.Abstractions;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RoomsServices.Commands;

public class DeleteRoomFileCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IRoomCommandRepository roomRepository,
    IRemoteUploadStorage storage)
    : CommandHandler<DeleteRoomFileCommand, object>(outer), IScopeLifetime
{
    public override async Task<CommandResult<object>> Handle(DeleteRoomFileCommand command)
    {
        try
        {
            var room = await roomRepository.GetWithFilesAsync(command.RoomId);
            if (room == null)
                return await ResultAsync("Room not found.", ApplicationServiceStatus.NotFound);

            var isOwner = room.UserId == command.RequestingUserId;
            if (!isOwner && !command.RequestingIsDashboardAdmin)
            {
                return await ResultAsync(
                    "Only the room owner or a dashboard admin can delete room files.",
                    ApplicationServiceStatus.ValidationError);
            }

            var removed = room.RemoveRoomFile(command.FileId);
            var key = storage.ToObjectKey(removed.FileUrl, FileAccessTier.Private);
            await storage.DeleteAsync(key);
            var uploadId = Path.GetFileNameWithoutExtension(removed.FileUrl);
            if (Guid.TryParseExact(uploadId, "N", out _)) await storage.DeleteUploadAsync("rooms", uploadId);
            await roomRepository.CommitAsync();

            return await OkAsync(new
            {
                roomId = command.RoomId,
                fileId = command.FileId,
                fileUrl = removed.FileUrl,
            });
        }
        catch (Exception)
        {
            return await ResultAsync(
                "Delete room file failed. Please retry.",
                ApplicationServiceStatus.Exception);
        }
    }
}
