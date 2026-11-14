using ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.Contracts.Enrollments.EnrollmentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Services;
using ArkaSoftwarePro.Src.Core.Domain.EnrollmentAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.StudentAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.RegisterFreeCourse;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Commands
{
    public class RegisterFreeCourseCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        ICourseCommandRepository courseCommandRepository,
        IStudentQueryRepository studentQueryRepository,
        IStudentCommandRepository studentCommandRepository,
        IEnrollmentCommandRepository enrollmentCommandRepository,
        CourseEnrollmentNotifier enrollmentNotifier,
        IUserQueryRepository userQueryRepository,
        ITransactionalEmailNotifier transactionalEmailNotifier,
        IHttpContextAccessor httpContextAccessor)
        : CommandHandler<RegisterFreeCourseCommand, string>(mafiaOuterServices)
    {
        public override async Task<CommandResult<string>> Handle(RegisterFreeCourseCommand command)
        {
            try
            {
                var userIdClaim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
                    x.Type == ClaimTypes.NameIdentifier ||
                    x.Type == "userId" ||
                    x.Type == "nameid");

                if (userIdClaim == null || string.IsNullOrEmpty(userIdClaim.Value) || !long.TryParse(userIdClaim.Value, out var userId))
                    return await ResultAsync("User Is Not Defined.", ApplicationServiceStatus.NotFound);

                var course = await courseCommandRepository.GetAsync(command.CourseId);
                if (course == null)
                    return await ResultAsync($"Course With Id : {command.CourseId} Is Not Defined.", ApplicationServiceStatus.NotFound);

                await courseCommandRepository.SyncLifecycleTransitionsAsync(command.CourseId);
                course = await courseCommandRepository.GetAsync(command.CourseId);
                if (course == null)
                    return await ResultAsync($"Course With Id : {command.CourseId} Is Not Defined.", ApplicationServiceStatus.NotFound);

                var effectivePhase = course.GetEffectiveLifecyclePhase(DateTime.UtcNow);
                if (!course.IsPubliclyVisible || !CourseLifecycleRules.CanAcceptRegistration(
                        course.IsPublish,
                        effectivePhase,
                        course.IsRegistrationClosed))
                    return await ResultAsync("Course registration is not available.", ApplicationServiceStatus.ValidationError);

                var amount = course.Price?.Amount ?? 0m;
                if (amount > 0)
                    return await ResultAsync("Course Is Not Free.", ApplicationServiceStatus.ValidationError);

                var studentId = await studentQueryRepository.GetStudentIdByUserIdAsync(userId);
                if (!studentId.HasValue)
                {
                    var student = new Student(userId);
                    await studentCommandRepository.InsertAsync(student);
                    await studentCommandRepository.CommitAsync();
                    studentId = await studentQueryRepository.GetStudentIdByUserIdAsync(userId);
                }

                if (!studentId.HasValue)
                    return await ResultAsync("Student Profile Not Found.", ApplicationServiceStatus.NotFound);

                var exists = await enrollmentCommandRepository.ExistsAsync(e =>
                    e.StudentId == studentId.Value && e.CourseId == command.CourseId);

                if (exists)
                    return await OkAsync("Course Already Enrolled.");

                var activateImmediately = true;
                var enrollment = new Enrollment(studentId.Value, command.CourseId, activateImmediately);
                if (CourseDeliveryModeParser.UsesArkaDesktopLicense(course.DeliveryMode))
                    enrollment.AssignDesktopLicense(DesktopLicenseGenerator.Generate());

                await enrollmentCommandRepository.InsertAsync(enrollment);
                await enrollmentCommandRepository.CommitAsync();

                var enrolledStudentName = httpContextAccessor.HttpContext?.User?.Identity?.Name
                    ?? httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Name)?.Value
                    ?? $"User {userId}";
                await enrollmentNotifier.NotifyStudentEnrolledAsync(course, enrollment, enrolledStudentName);

                try
                {
                    var userProfile = await userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = userId });
                    var email = userProfile?.Email;
                    if (!string.IsNullOrWhiteSpace(email))
                    {
                        await transactionalEmailNotifier.SendCourseEnrollmentInvoiceAsync(
                            email,
                            enrolledStudentName,
                            course.Title?.Value ?? "دوره",
                            enrollment.Id.ToString(),
                            "رایگان",
                            null);
                    }
                }
                catch
                {
                    // Enrollment succeeds even if invoice email fails.
                }

                return await OkAsync("Course Enrolled Successfully.");
            }
            catch (Exception ex)
            {
                return await ResultAsync($"Register Free Course Has Error: {ex.Message}", ApplicationServiceStatus.Exception);
            }
        }
    }
}
