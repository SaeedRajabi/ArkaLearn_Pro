using ArkaSoftwarePro.Src.Core.ApplicationService.DesktopDrmServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm.DesktopDrmRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Enrollments.EnrollmentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetCourseDesktopAnalytics;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetCourseDesktopLicenses;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetCourseDesktopWatermarkPolicy;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetDesktopWatermarkForPlayback;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetTeacherStudentSatisfaction;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.ListDesktopLicenseDevices;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.DesktopDrmServices.Queries;

public sealed class GetCourseDesktopWatermarkPolicyQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ICourseCommandRepository courseCommandRepository,
    IDesktopDrmQueryRepository repository,
    ITeacherQueryRepository teacherQueryRepository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<GetCourseDesktopWatermarkPolicyQuery, CourseDesktopWatermarkPolicyQri?>(outer)
{
    public override async Task<QueryResult<CourseDesktopWatermarkPolicyQri?>> Handle(GetCourseDesktopWatermarkPolicyQuery query)
    {
        if (query.RequestingUserId <= 0 || query.CourseId <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        var course = await courseCommandRepository.GetAsync(query.CourseId);
        if (course is null || !DesktopDrmCourseAuthorization.IsArkaDesktopDelivery(course.DeliveryMode))
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        if (!await DesktopDrmCourseAuthorization.CanManageCourseAsync(
                query.RequestingUserId, course.TeacherId, teacherQueryRepository, httpContextAccessor, AddMessage))
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        var policy = await repository.GetCourseWatermarkPolicyAsync(query.CourseId);
        return await ResultAsync(policy, ApplicationServiceStatus.Ok);
    }
}

public sealed class GetCourseDesktopLicensesQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ICourseCommandRepository courseCommandRepository,
    IDesktopDrmQueryRepository repository,
    ITeacherQueryRepository teacherQueryRepository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<GetCourseDesktopLicensesQuery, List<CourseDesktopLicenseEnrollmentQri>>(outer)
{
    public override async Task<QueryResult<List<CourseDesktopLicenseEnrollmentQri>>> Handle(GetCourseDesktopLicensesQuery query)
    {
        if (query.RequestingUserId <= 0 || query.CourseId <= 0)
            return await ResultAsync([], ApplicationServiceStatus.ValidationError);

        var course = await courseCommandRepository.GetAsync(query.CourseId);
        if (course is null || !DesktopDrmCourseAuthorization.IsArkaDesktopDelivery(course.DeliveryMode))
            return await ResultAsync([], ApplicationServiceStatus.NotFound);

        if (!await DesktopDrmCourseAuthorization.CanManageCourseAsync(
                query.RequestingUserId, course.TeacherId, teacherQueryRepository, httpContextAccessor, AddMessage))
            return await ResultAsync([], ApplicationServiceStatus.ValidationError);

        var items = await repository.ListCourseDesktopLicensesAsync(query.CourseId);
        return await ResultAsync(items, ApplicationServiceStatus.Ok);
    }
}

public sealed class ListDesktopLicenseDevicesQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ICourseCommandRepository courseCommandRepository,
    IEnrollmentCommandRepository enrollmentCommandRepository,
    IDesktopDrmQueryRepository repository,
    ITeacherQueryRepository teacherQueryRepository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<ListDesktopLicenseDevicesQuery, List<DesktopLicenseDeviceBindingQri>>(outer)
{
    public override async Task<QueryResult<List<DesktopLicenseDeviceBindingQri>>> Handle(ListDesktopLicenseDevicesQuery query)
    {
        if (query.RequestingUserId <= 0 || query.EnrollmentId <= 0)
            return await ResultAsync([], ApplicationServiceStatus.ValidationError);

        var enrollment = await enrollmentCommandRepository.GetByIdForEditAsync(query.EnrollmentId);
        if (enrollment is null || !enrollment.CourseId.HasValue)
            return await ResultAsync([], ApplicationServiceStatus.NotFound);

        var course = await courseCommandRepository.GetAsync(enrollment.CourseId.Value);
        if (course is null || !DesktopDrmCourseAuthorization.IsArkaDesktopDelivery(course.DeliveryMode))
            return await ResultAsync([], ApplicationServiceStatus.NotFound);

        if (!await DesktopDrmCourseAuthorization.CanManageCourseAsync(
                query.RequestingUserId, course.TeacherId, teacherQueryRepository, httpContextAccessor, AddMessage))
            return await ResultAsync([], ApplicationServiceStatus.ValidationError);

        var items = await repository.ListDesktopLicenseDevicesAsync(query.EnrollmentId);
        return await ResultAsync(items, ApplicationServiceStatus.Ok);
    }
}

public sealed class GetCourseDesktopAnalyticsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ICourseCommandRepository courseCommandRepository,
    IDesktopDrmQueryRepository repository,
    ITeacherQueryRepository teacherQueryRepository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<GetCourseDesktopAnalyticsQuery, CourseDesktopAnalyticsQri>(outer)
{
    public override async Task<QueryResult<CourseDesktopAnalyticsQri>> Handle(GetCourseDesktopAnalyticsQuery query)
    {
        if (query.RequestingUserId <= 0 || query.CourseId <= 0)
            return await ResultAsync(new CourseDesktopAnalyticsQri(), ApplicationServiceStatus.ValidationError);

        var course = await courseCommandRepository.GetAsync(query.CourseId);
        if (course is null || !DesktopDrmCourseAuthorization.IsArkaDesktopDelivery(course.DeliveryMode))
            return await ResultAsync(new CourseDesktopAnalyticsQri(), ApplicationServiceStatus.NotFound);

        if (!await DesktopDrmCourseAuthorization.CanManageCourseAsync(
                query.RequestingUserId, course.TeacherId, teacherQueryRepository, httpContextAccessor, AddMessage))
            return await ResultAsync(new CourseDesktopAnalyticsQri(), ApplicationServiceStatus.ValidationError);

        var analytics = await repository.GetCourseDesktopAnalyticsAsync(query.CourseId);
        return await ResultAsync(analytics, ApplicationServiceStatus.Ok);
    }
}

public sealed class GetTeacherStudentSatisfactionQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ICourseCommandRepository courseCommandRepository,
    IEnrollmentCommandRepository enrollmentCommandRepository,
    IDesktopDrmQueryRepository repository,
    ITeacherQueryRepository teacherQueryRepository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<GetTeacherStudentSatisfactionQuery, List<TeacherStudentSatisfactionItemQri>>(outer)
{
    public override async Task<QueryResult<List<TeacherStudentSatisfactionItemQri>>> Handle(GetTeacherStudentSatisfactionQuery query)
    {
        if (query.RequestingUserId <= 0)
            return await ResultAsync([], ApplicationServiceStatus.ValidationError);

        if (query.EnrollmentId > 0)
        {
            var enrollment = await enrollmentCommandRepository.GetByIdForEditAsync(query.EnrollmentId);
            if (enrollment is null || !enrollment.CourseId.HasValue)
                return await ResultAsync([], ApplicationServiceStatus.NotFound);

            var course = await courseCommandRepository.GetAsync(enrollment.CourseId.Value);
            if (course is null || !DesktopDrmCourseAuthorization.IsArkaDesktopDelivery(course.DeliveryMode))
                return await ResultAsync([], ApplicationServiceStatus.NotFound);

            if (!await DesktopDrmCourseAuthorization.CanManageCourseAsync(
                    query.RequestingUserId, course.TeacherId, teacherQueryRepository, httpContextAccessor, AddMessage))
                return await ResultAsync([], ApplicationServiceStatus.ValidationError);

            var single = await repository.GetTeacherStudentSatisfactionByEnrollmentAsync(query.EnrollmentId);
            return await ResultAsync(single is null ? [] : [single], ApplicationServiceStatus.Ok);
        }

        if (query.CourseId <= 0)
            return await ResultAsync([], ApplicationServiceStatus.ValidationError);

        var courseRow = await courseCommandRepository.GetAsync(query.CourseId);
        if (courseRow is null || !DesktopDrmCourseAuthorization.IsArkaDesktopDelivery(courseRow.DeliveryMode))
            return await ResultAsync([], ApplicationServiceStatus.NotFound);

        if (!await DesktopDrmCourseAuthorization.CanManageCourseAsync(
                query.RequestingUserId, courseRow.TeacherId, teacherQueryRepository, httpContextAccessor, AddMessage))
            return await ResultAsync([], ApplicationServiceStatus.ValidationError);

        var items = await repository.ListTeacherStudentSatisfactionByCourseAsync(query.CourseId);
        return await ResultAsync(items, ApplicationServiceStatus.Ok);
    }
}

public sealed class GetDesktopWatermarkForPlaybackQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IDesktopDrmQueryRepository repository)
    : QueryHandler<GetDesktopWatermarkForPlaybackQuery, DesktopWatermarkForPlaybackQri?>(outer)
{
    public override async Task<QueryResult<DesktopWatermarkForPlaybackQri?>> Handle(GetDesktopWatermarkForPlaybackQuery query)
    {
        if (query.UserId <= 0 || query.CourseId <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        var result = await repository.GetDesktopWatermarkForPlaybackAsync(query.UserId, query.CourseId);
        if (result is null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }
}
