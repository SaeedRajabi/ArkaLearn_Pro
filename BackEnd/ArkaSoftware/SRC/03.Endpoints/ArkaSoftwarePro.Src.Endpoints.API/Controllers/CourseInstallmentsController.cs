using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.Contracts.EducationPlans.EducationPlanRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Enrollments.EnrollmentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.AdminMarkCourseInstallmentPaid;
using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Commands.AdminMarkEducationPlanInstallmentPaid;
using ArkaSoftwarePro.Src.Endpoints.API.Common;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
[ApiController]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
public class CourseInstallmentsController(
    IEnrollmentCommandRepository enrollmentRepository,
    IEducationPlanQueryRepository educationPlanQueryRepository) : BaseController
{
    [HttpGet("List")]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        if (!User.IsDashboardAdminRole()) return Forbid();

        var rows = await enrollmentRepository.GetInstallmentEnrollmentsForAdminAsync(cancellationToken);
        var now = DateTime.UtcNow;
        var result = rows.Select(e =>
        {
            var installments = e.Installments.OrderBy(i => i.InstallmentNumber).ToList();
            var totalAmount = installments.Sum(i => i.Amount);
            var paidAmount = installments.Where(i => i.IsPaid).Sum(i => i.Amount);
            return new
            {
                enrollmentId = e.Id,
                courseId = e.CourseId,
                courseTitle = e.Course?.Title?.Value ?? "",
                studentId = e.StudentId,
                studentName = e.Student?.User != null ? $"{e.Student.User.UserFullName}" : "",
                studentEmail = e.Student?.User?.Email?.Value ?? "",
                enrolledAt = e.EnrollmentDateTime,
                licenseKey = e.DesktopLicenseKey,
                licenseExpiresAtUtc = e.DesktopLicenseExpiresAtUtc,
                contentAccessMode = e.DesktopContentAccessMode.ToString(),
                installmentCount = installments.Count,
                paidInstallmentCount = installments.Count(i => i.IsPaid),
                totalAmount,
                paidAmount,
                remainingAmount = Math.Max(0, totalAmount - paidAmount),
                installments = installments.Select(i => new
                {
                    id = i.Id,
                    number = i.InstallmentNumber,
                    amount = i.Amount,
                    dueDate = i.DueDate,
                    isPaid = i.IsPaid,
                    paidDate = i.PaidDate,
                    paymentReference = i.PaymentReference,
                    isOverdue = i.IsOverdue(now),
                }),
            };
        });

        return Ok(result);
    }

    [HttpGet("ListEducationPlans")]
    public async Task<IActionResult> ListEducationPlans(CancellationToken cancellationToken)
    {
        if (!User.IsDashboardAdminRole()) return Forbid();

        var rows = await educationPlanQueryRepository.GetInstallmentPlansForAdminAsync(cancellationToken);
        return Ok(rows);
    }

    [HttpPost("MarkCoursePaid")]
    public async Task<IActionResult> MarkCoursePaid([FromBody] AdminMarkCourseInstallmentPaidCommand command)
    {
        if (!User.IsDashboardAdminRole()) return Forbid();
        return await Edit<AdminMarkCourseInstallmentPaidCommand, string>(command);
    }

    [HttpPost("MarkEducationPlanPaid")]
    public async Task<IActionResult> MarkEducationPlanPaid([FromBody] AdminMarkEducationPlanInstallmentPaidCommand command)
    {
        if (!User.IsDashboardAdminRole()) return Forbid();
        return await Edit<AdminMarkEducationPlanInstallmentPaidCommand, string>(command);
    }
}
