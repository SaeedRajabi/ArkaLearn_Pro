using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.LogoutUsers;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Commands
{
    public class LogoutCommandHandler : CommandHandler<LogoutUser, bool>
    {
        private readonly IUserCommandRepository _userCommandRepository;
        public LogoutCommandHandler(ArkaSoftwareCMPOutServices mafiaOuterServices,
            IUserCommandRepository userCommandRepository) : base(mafiaOuterServices)
        {
            _userCommandRepository = userCommandRepository;
        }

        public override async Task<CommandResult<bool>> Handle(LogoutUser command)
        {
            try
            {
                var userExist = await _userCommandRepository.GetGraphAsync(command.UserId);
                userExist.Logout();
                await _userCommandRepository.CommitAsync();
                return await OkAsync(true);
            }
            catch
            {
                return await ResultAsync(false, Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.Exception);
            }
        }
    }
}
