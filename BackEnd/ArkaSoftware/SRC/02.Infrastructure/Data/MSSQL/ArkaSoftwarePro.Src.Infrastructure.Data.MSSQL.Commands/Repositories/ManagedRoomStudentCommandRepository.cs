using ArkaSoftwarePro.Src.Core.Contracts.ManagedRoomStudents.ManagedRoomStudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public class ManagedRoomStudentCommandRepository(ArkaSoftwareCommandDbContext dbContext)
    : BaseCommandRepository<ManagedRoomStudent, ArkaSoftwareCommandDbContext>(dbContext),
        IManagedRoomStudentCommandRepository
{
    public Task<ManagedRoomStudent?> GetByIdOrDefaultAsync(long id) =>
        _dbContext.ManagedRoomStudents.FirstOrDefaultAsync(x => x.Id == id && !x.IsDelete);

    public Task<ManagedRoomStudent?> GetByIdIncludingDeletedAsync(long id) =>
        _dbContext.ManagedRoomStudents.FirstOrDefaultAsync(x => x.Id == id);

    public async Task<ManagedRoomStudent?> FindActiveByUserNameOrEmailAsync(string userName, string? email)
    {
        var normalizedUserName = (userName ?? string.Empty).Trim();
        var normalizedEmail = (email ?? string.Empty).Trim();

        if (!string.IsNullOrEmpty(normalizedUserName))
        {
            var userNameVo = new UserName(normalizedUserName);
            var byUserName = await _dbContext.ManagedRoomStudents.FirstOrDefaultAsync(x =>
                !x.IsDelete && x.UserName == userNameVo);
            if (byUserName != null)
                return byUserName;
        }

        if (!string.IsNullOrEmpty(normalizedEmail))
        {
            var emailLower = normalizedEmail.ToLowerInvariant();
            return await _dbContext.ManagedRoomStudents.FirstOrDefaultAsync(x =>
                !x.IsDelete &&
                x.Email != null &&
                x.Email.ToLower() == emailLower);
        }

        return null;
    }
}
