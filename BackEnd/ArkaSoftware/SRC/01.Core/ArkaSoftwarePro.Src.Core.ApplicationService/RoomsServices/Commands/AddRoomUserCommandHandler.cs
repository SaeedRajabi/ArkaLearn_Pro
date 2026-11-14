using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.AddRoomUsers;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RoomsServices.Commands
{
    public class AddRoomUserCommandHandler : CommandHandler<AddRoomUserCommand, string>
    {
        private readonly IRoomCommandRepository _roomCommandRepository;
        public AddRoomUserCommandHandler(ArkaSoftwareCMPOutServices mafiaOuterServices , 
            IRoomCommandRepository roomCommandRepository) : base(mafiaOuterServices)
        {
            _roomCommandRepository = roomCommandRepository;
        }

        public override async Task<CommandResult<string>> Handle(AddRoomUserCommand command)
        {
            try
            {
                var userRoomExist = await _roomCommandRepository.GetGraphAsync(command.RoomId);
                if (userRoomExist == null!)
                    return await ResultAsync(null!, Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.NotFound);
                userRoomExist.AddUserRoom(command.FirstName, command.LastName, command.UserName, command.Password);
                await _roomCommandRepository.CommitAsync();
                return await OkAsync("User Added To Room Success");
            }
            catch
            {
                return await ResultAsync(null!, Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.Exception);
            }
        }
    }
}
