using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Enrollments.EnrollmentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Seminars.SeminarRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.RemoveTeacherStudent;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Commands;

public class RemoveTeacherStudentCommandHandler(
    ArkaSoftwareCMPOutServices outerServices,
    ICourseQueriesRepository courseQueriesRepository,
    ITeacherQueryRepository teacherQueryRepository,
    IStudentQueryRepository studentQueryRepository,
    IEnrollmentCommandRepository enrollmentCommandRepository,
    ISeminarCommandRepository seminarCommandRepository)
    : CommandHandler<RemoveTeacherStudentCommand, bool>(outerServices)
{
    public override async Task<CommandResult<bool>> Handle(RemoveTeacherStudentCommand command)
    {
        if (command.TeacherUserId <= 0 || command.PortalUserId <= 0)
            return await ResultAsync(false, ApplicationServiceStatus.ValidationError);

        if (!await courseQueriesRepository.IsPortalUserInTeacherScopeAsync(
                command.TeacherUserId,
                command.PortalUserId))
            return await ResultAsync(false, ApplicationServiceStatus.ValidationError);

        var teacherId = await teacherQueryRepository.GetTeacherIdByUserIdAsync(command.TeacherUserId);
        var studentId = await studentQueryRepository.GetStudentIdByUserIdAsync(command.PortalUserId);

        var removedCount = 0;

        if (teacherId.HasValue && studentId.HasValue)
        {
            var enrollments = await enrollmentCommandRepository.GetByStudentAndTeacherAsync(
                studentId.Value,
                teacherId.Value);

            foreach (var enrollment in enrollments)
            {
                enrollmentCommandRepository.Delete(enrollment);
                removedCount++;
            }

            if (enrollments.Count > 0)
                await enrollmentCommandRepository.CommitAsync();
        }

        var seminars = await seminarCommandRepository.GetTeacherSeminarsWithRegistrationsAsync(command.TeacherUserId);
        var seminarChanged = false;

        foreach (var seminar in seminars)
        {
            if (seminar.Registrations.All(r => r.UserId != command.PortalUserId))
                continue;

            try
            {
                seminar.CancelRegistration(command.PortalUserId);
                removedCount++;
                seminarChanged = true;
            }
            catch
            {
                // skip invalid state
            }
        }

        if (seminarChanged)
            await seminarCommandRepository.CommitAsync();

        if (removedCount == 0)
            return await ResultAsync(false, ApplicationServiceStatus.NotFound);

        return await OkAsync(true);
    }
}
