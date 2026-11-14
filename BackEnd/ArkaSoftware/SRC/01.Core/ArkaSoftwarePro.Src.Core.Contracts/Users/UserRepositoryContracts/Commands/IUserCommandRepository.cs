using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands
{
    public interface IUserCommandRepository : ICommandRepository<User, long>
    {
        User? FindByUserNameAsync(string userName);
    }

}
