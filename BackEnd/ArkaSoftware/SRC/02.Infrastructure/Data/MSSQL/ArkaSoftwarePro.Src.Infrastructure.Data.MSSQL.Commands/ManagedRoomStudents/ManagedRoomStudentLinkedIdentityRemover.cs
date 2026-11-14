using ArkaSoftwarePro.Src.Core.Contracts.ManagedRoomStudents.Services;
using ArkaSoftwarePro.Src.Core.Contracts.Users.Services;
using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.ManagedRoomStudents;

public class ManagedRoomStudentLinkedIdentityRemover(
    ArkaSoftwareCommandDbContext dbContext,
    IUserPortalAccountRemover userPortalAccountRemover)
    : IManagedRoomStudentLinkedIdentityRemover
{
    public async Task RemoveLinkedPortalIdentityAsync(ManagedRoomStudent managed, CancellationToken cancellationToken = default)
    {
        var emailObj = string.IsNullOrWhiteSpace(managed.Email) ? null : new Email(managed.Email.Trim());
        var userNameObj = managed.UserName;

        var user = await dbContext.Users.AsQueryable().FirstOrDefaultAsync(
            u =>
                u.Role == UserRole.STUDENT &&
                (u.UserName == userNameObj || (emailObj != null && u.Email == emailObj)),
            cancellationToken);

        if (user == null)
            return;

        await userPortalAccountRemover.RemoveUserByIdAsync(user.Id, cancellationToken);
    }
}
