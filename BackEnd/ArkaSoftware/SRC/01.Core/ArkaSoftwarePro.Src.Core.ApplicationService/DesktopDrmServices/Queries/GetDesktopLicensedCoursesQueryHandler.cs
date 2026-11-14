using ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm.DesktopDrmRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Enrollments.EnrollmentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetDesktopLicensedCourses;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.DesktopDrmServices.Queries;

public class GetDesktopLicensedCoursesQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IDesktopDrmQueryRepository repository,
    IEnrollmentCommandRepository enrollmentCommandRepository)
    : QueryHandler<GetDesktopLicensedCoursesQuery, List<DesktopLicensedCourseQri>>(outer)
{
    public override async Task<QueryResult<List<DesktopLicensedCourseQri>>> Handle(GetDesktopLicensedCoursesQuery query)
    {
        if (query.UserId <= 0)
            return await ResultAsync([], ApplicationServiceStatus.ValidationError);

        await enrollmentCommandRepository.EnsureDesktopLicensesForUserAsync(query.UserId);
        var items = await repository.ListDesktopLicensedCoursesAsync(query.UserId);
        return await ResultAsync(items, ApplicationServiceStatus.Ok);
    }
}