using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.ManagedRoomStudents.ManagedRoomStudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.AdminAssignStudentRooms;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Commands;

public class AdminAssignStudentRoomsCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ICourseQueriesRepository courseQueriesRepository,
    IManagedRoomStudentCommandRepository managedRepository,
    IRoomCommandRepository roomRepository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<AdminAssignStudentRoomsCommand, AdminAssignStudentRoomsResult>(outer)
{
    public override async Task<CommandResult<AdminAssignStudentRoomsResult>> Handle(AdminAssignStudentRoomsCommand command)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
        {
            AddMessage("Admin access required.");
            return await ResultAsync(new AdminAssignStudentRoomsResult(), ApplicationServiceStatus.ValidationError);
        }

        if (command.PortalUserId <= 0)
            return await ResultAsync(new AdminAssignStudentRoomsResult(), ApplicationServiceStatus.ValidationError);

        var roomIds = command.RoomIds?.Where(x => x > 0).Distinct().ToList() ?? [];
        if (roomIds.Count == 0)
            return await ResultAsync(new AdminAssignStudentRoomsResult(), ApplicationServiceStatus.ValidationError);

        var managedId = await courseQueriesRepository.FindManagedRoomStudentIdByPortalUserIdAsync(command.PortalUserId);
        if (managedId is not > 0)
            return await ResultAsync(new AdminAssignStudentRoomsResult(), ApplicationServiceStatus.NotFound);

        var managed = await managedRepository.GetByIdOrDefaultAsync(managedId.Value);
        if (managed == null)
            return await ResultAsync(new AdminAssignStudentRoomsResult(), ApplicationServiceStatus.NotFound);

        var assigned = 0;
        foreach (var roomId in roomIds)
        {
            var room = await roomRepository.GetWithRoomUsersAsync(roomId);
            if (room == null)
                continue;

            room.AssignOrSyncManagedStudentSeat(managed, null);
            assigned++;
        }

        await roomRepository.CommitAsync();
        return await OkAsync(new AdminAssignStudentRoomsResult { AssignedRoomCount = assigned });
    }
}
