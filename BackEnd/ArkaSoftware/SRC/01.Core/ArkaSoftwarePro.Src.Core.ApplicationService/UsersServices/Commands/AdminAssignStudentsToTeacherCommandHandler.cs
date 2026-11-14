using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Enrollments.EnrollmentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.EnrollmentAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.StudentAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.AdminAssignStudentsToTeacher;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Commands;

public class AdminAssignStudentsToTeacherCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ICourseCommandRepository courseCommandRepository,
    ICourseQueriesRepository courseQueriesRepository,
    ITeacherQueryRepository teacherQueryRepository,
    IStudentQueryRepository studentQueryRepository,
    IStudentCommandRepository studentCommandRepository,
    IEnrollmentCommandRepository enrollmentCommandRepository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<AdminAssignStudentsToTeacherCommand, AdminAssignStudentsToTeacherResult>(outer)
{
    public override async Task<CommandResult<AdminAssignStudentsToTeacherResult>> Handle(AdminAssignStudentsToTeacherCommand command)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
        {
            AddMessage("Admin access required.");
            return await ResultAsync(new AdminAssignStudentsToTeacherResult(), ApplicationServiceStatus.ValidationError);
        }

        if (command.TeacherUserId <= 0 || command.CourseId <= 0)
            return await ResultAsync(new AdminAssignStudentsToTeacherResult(), ApplicationServiceStatus.ValidationError);

        var teacherId = await teacherQueryRepository.GetTeacherIdByUserIdAsync(command.TeacherUserId);
        if (!teacherId.HasValue)
            return await ResultAsync(new AdminAssignStudentsToTeacherResult(), ApplicationServiceStatus.NotFound);

        var courseTeacherId = await courseQueriesRepository.GetCourseTeacherIdAsync(command.CourseId);
        if (!courseTeacherId.HasValue || courseTeacherId.Value != teacherId.Value)
        {
            AddMessage("Course does not belong to the specified teacher.");
            return await ResultAsync(new AdminAssignStudentsToTeacherResult(), ApplicationServiceStatus.ValidationError);
        }

        var course = await courseCommandRepository.GetAsync(command.CourseId);
        if (course == null)
            return await ResultAsync(new AdminAssignStudentsToTeacherResult(), ApplicationServiceStatus.NotFound);

        var studentUserIds = command.StudentUserIds?.Where(x => x > 0).Distinct().ToList() ?? [];
        if (studentUserIds.Count == 0)
            return await ResultAsync(new AdminAssignStudentsToTeacherResult(), ApplicationServiceStatus.ValidationError);

        var enrolled = 0;
        var skipped = 0;
        var activateImmediately = true;

        foreach (var studentUserId in studentUserIds)
        {
            var studentId = await studentQueryRepository.GetStudentIdByUserIdAsync(studentUserId);
            if (!studentId.HasValue)
            {
                var student = new Student(studentUserId);
                await studentCommandRepository.InsertAsync(student);
                await studentCommandRepository.CommitAsync();
                studentId = await studentQueryRepository.GetStudentIdByUserIdAsync(studentUserId);
            }

            if (!studentId.HasValue)
            {
                skipped++;
                continue;
            }

            var exists = await enrollmentCommandRepository.ExistsAsync(e =>
                e.StudentId == studentId.Value && e.CourseId == command.CourseId);
            if (exists)
            {
                skipped++;
                continue;
            }

            var enrollment = new Enrollment(studentId.Value, command.CourseId, activateImmediately);
            if (CourseDeliveryModeParser.UsesArkaDesktopLicense(course.DeliveryMode))
                enrollment.AssignDesktopLicense(DesktopLicenseGenerator.Generate());
            await enrollmentCommandRepository.InsertAsync(enrollment);
            enrolled++;
        }

        if (enrolled > 0)
            await enrollmentCommandRepository.CommitAsync();

        return await OkAsync(new AdminAssignStudentsToTeacherResult
        {
            EnrolledCount = enrolled,
            SkippedCount = skipped,
        });
    }
}
