using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories
{
    public class UserCommandRepository : BaseCommandRepository<User, ArkaSoftwareCommandDbContext>, IUserCommandRepository
    {
        public UserCommandRepository(ArkaSoftwareCommandDbContext dbContext) : base(dbContext)
        {

        }
        public User? FindByUserNameAsync(string userName)
        {
            if (string.IsNullOrWhiteSpace(userName))
                return null;

            var normalized = userName.Trim().ToLowerInvariant();
            return _dbContext.Users.AsEnumerable().FirstOrDefault(x =>
                x.UserName.Value.ToLowerInvariant() == normalized ||
                x.Email.Value.ToLowerInvariant() == normalized);
        }

    }
}
