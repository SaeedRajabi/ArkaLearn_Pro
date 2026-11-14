using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.ManagedRoomStudents.ManagedRoomStudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.ManagedRoomStudents.Queries.GetPortalStudentRoomProfile;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ManagedRoomStudentsServices.Queries;

public class GetPortalStudentRoomProfileQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ICourseQueriesRepository courseQueriesRepository,
    IUserQueryRepository userQueryRepository,
    IManagedRoomStudentCommandRepository managedRoomStudentRepository)
    : QueryHandler<GetPortalStudentRoomProfileQuery, GetPortalStudentRoomProfileQri>(outer)
{
    public override async Task<QueryResult<GetPortalStudentRoomProfileQri>> Handle(GetPortalStudentRoomProfileQuery query)
    {
        if (query.TeacherUserId <= 0 || query.PortalUserId <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        if (!await courseQueriesRepository.IsPortalUserInTeacherScopeAsync(
                query.TeacherUserId,
                query.PortalUserId))
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        var user = await userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = query.PortalUserId });
        if (user == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var managedId = await courseQueriesRepository.FindManagedRoomStudentIdByPortalUserIdAsync(query.PortalUserId);

        var firstName = user.FirstName?.Trim() ?? string.Empty;
        var lastName = user.LastName?.Trim() ?? string.Empty;
        var roomUserName = user.UserName;

        if (managedId is > 0)
        {
            var managed = await managedRoomStudentRepository.GetByIdOrDefaultAsync(managedId.Value);
            if (managed != null)
            {
                firstName = managed.FirstName;
                lastName = managed.LastName;
                roomUserName = managed.UserName.Value;
            }
        }

        return await ResultAsync(
            new GetPortalStudentRoomProfileQri
            {
                PortalUserId = query.PortalUserId,
                ManagedRoomStudentId = managedId,
                FirstName = firstName,
                LastName = lastName,
                RoomUserName = roomUserName,
                Email = user.Email,
                Phone = user.PhoneNumber,
            },
            ApplicationServiceStatus.Ok);
    }
}
