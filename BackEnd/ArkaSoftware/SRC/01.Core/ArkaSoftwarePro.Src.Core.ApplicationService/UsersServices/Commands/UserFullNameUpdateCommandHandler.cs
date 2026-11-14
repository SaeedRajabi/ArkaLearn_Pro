using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.UpdateUserFullName;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Commands
{
    public class UserFullNameUpdateCommandHandler : CommandHandler<UpdateUserFullNameCommand, string>
    {
        private readonly IUserCommandRepository _userCommandRepository;
        public UserFullNameUpdateCommandHandler(ArkaSoftwareCMPOutServices mafiaOuterServices , IUserCommandRepository userCommandRepository) : base(mafiaOuterServices)
        {
            _userCommandRepository = userCommandRepository;
        }

        public override async Task<CommandResult<string>> Handle(UpdateUserFullNameCommand command)
        {
            try
            {
                var userResult = await _userCommandRepository.GetAsync(long.Parse(command.UserId!));
                if (userResult == null!)
                    return await ResultAsync($"User With Id : {command.UserId} Is Not Defind", ApplicationServiceStatus.NotFound);
                userResult.UpdateUserFullName(command.FirstName, command.LastName);
                await _userCommandRepository.CommitAsync();
                return await OkAsync("User Updated Success.");
            }
            catch
            {
                return await ResultAsync($"User FullName Update Has Exception.", ApplicationServiceStatus.Exception);
            }
        }
    }
}
