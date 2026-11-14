using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.DesktopDrmServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Enrollments.EnrollmentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.EnrollmentAggregate.Services;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.RequestDesktopLicense;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.DesktopDrmServices.Commands;

public sealed class RequestDesktopLicenseCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ICourseCommandRepository courseCommandRepository,
    IEnrollmentCommandRepository enrollmentCommandRepository,
    IStudentQueryRepository studentQueryRepository,
    CourseEnrollmentNotifier enrollmentNotifier,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<RequestDesktopLicenseCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(RequestDesktopLicenseCommand command)
    {
        var userId = ResolveUserId();
        if (userId <= 0 || command.CourseId <= 0)
            return await ResultAsync("درخواست نامعتبر است.", ApplicationServiceStatus.ValidationError);

        var course = await courseCommandRepository.GetAsync(command.CourseId);
        if (course is null || !DesktopDrmCourseAuthorization.IsArkaDesktopDelivery(course.DeliveryMode))
            return await ResultAsync("این دوره لایسنس دسکتاپ ندارد.", ApplicationServiceStatus.NotFound);

        var studentId = await studentQueryRepository.GetStudentIdByUserIdAsync(userId);
        if (!studentId.HasValue)
            return await ResultAsync("پروفایل دانشجو یافت نشد.", ApplicationServiceStatus.NotFound);

        var enrollment = await enrollmentCommandRepository.GetByStudentAndCourseAsync(studentId.Value, command.CourseId);
        if (enrollment is null)
            return await ResultAsync("ابتدا باید در این دوره ثبت‌نام / خرید کرده باشید.", ApplicationServiceStatus.ValidationError);

        if (!string.IsNullOrWhiteSpace(enrollment.DesktopLicenseKey))
            return await OkAsync("لایسنس این دوره قبلاً صادر شده است.");

        if (DesktopLicenseRequestMarkers.IsPending(enrollment.SpotPlayerLicense))
            return await OkAsync("درخواست لایسنس قبلاً ثبت شده و در انتظار تأیید استاد است.");

        enrollment.MarkDesktopLicenseRequested();
        await enrollmentCommandRepository.CommitAsync();

        var studentName = httpContextAccessor.HttpContext?.User?.Identity?.Name
            ?? httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Name)?.Value
            ?? $"کاربر {userId}";

        await enrollmentNotifier.NotifyLicenseRegistrationPendingAsync(course, enrollment, studentName);

        return await OkAsync("درخواست لایسنس ثبت شد. استاد از طریق ایمیل و اعلان مطلع شد.");
    }

    private long ResolveUserId()
    {
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier || x.Type == "userId" || x.Type == "nameid");
        return claim != null && long.TryParse(claim.Value, out var id) ? id : 0;
    }
}
