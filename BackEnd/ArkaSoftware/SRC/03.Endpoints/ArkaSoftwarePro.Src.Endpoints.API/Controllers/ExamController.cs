using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Commands.AbandonExamAttempt;
using ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Commands.CreateExam;
using ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Commands.GradeExamAttempt;
using ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Commands.SaveExamAnswers;
using ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Commands.StartExamAttempt;
using ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Commands.SubmitExamAttempt;
using ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Queries.GetCourseStudentsForExam;
using ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Queries.GetExamAttemptForGrading;
using ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Queries.GetExamById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Queries.GetExamForTaking;
using ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Queries.GetMyAssignedExams;
using ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Queries.SearchTeacherExams;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
public class ExamController : BaseController
{
    [HttpPost("Create")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Create([FromBody] CreateExam command)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized();
        command.TeacherUserId = userId;
        return await Create<CreateExam, string>(command);
    }

    [HttpGet("SearchTeacher")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> SearchTeacher([FromQuery] SearchTeacherExamsQuery query)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized();
        query.TeacherUserId = userId;
        return await Query<SearchTeacherExamsQuery, PagedData<SearchTeacherExamQri>>(query);
    }

    [HttpGet("GetById")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetById([FromQuery] GetExamByIdQuery query)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized();
        query.TeacherUserId = userId;
        return await Query<GetExamByIdQuery, ExamDetailQri>(query);
    }

    [HttpGet("GetMyAssigned")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetMyAssigned([FromQuery] GetMyAssignedExamsQuery query)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized();
        query.UserId = userId;
        return await Query<GetMyAssignedExamsQuery, List<AssignedExamQri>>(query);
    }

    [HttpGet("GetForTaking")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetForTaking([FromQuery] GetExamForTakingQuery query)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized();
        query.UserId = userId;
        return await Query<GetExamForTakingQuery, ExamTakingQri>(query);
    }

    [HttpPost("StartAttempt")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> StartAttempt([FromBody] StartExamAttempt command)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized();
        command.UserId = userId;
        return await Create<StartExamAttempt, StartExamAttemptResult>(command);
    }

    [HttpPost("SaveAnswers")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> SaveAnswers([FromBody] SaveExamAnswers command)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized();
        command.UserId = userId;
        return await Create<SaveExamAnswers, string>(command);
    }

    [HttpPost("SubmitAttempt")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> SubmitAttempt([FromBody] SubmitExamAttempt command)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized();
        command.UserId = userId;
        return await Create<SubmitExamAttempt, string>(command);
    }

    [HttpPost("AbandonAttempt")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> AbandonAttempt([FromBody] AbandonExamAttempt command)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized();
        command.UserId = userId;
        return await Create<AbandonExamAttempt, string>(command);
    }

    [HttpGet("GetAttemptForGrading")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetAttemptForGrading([FromQuery] GetExamAttemptForGradingQuery query)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized();
        query.TeacherUserId = userId;
        return await Query<GetExamAttemptForGradingQuery, ExamAttemptGradingQri>(query);
    }

    [HttpPost("GradeAttempt")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GradeAttempt([FromBody] GradeExamAttempt command)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized();
        command.TeacherUserId = userId;
        return await Create<GradeExamAttempt, string>(command);
    }

    [HttpGet("GetCourseStudents")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetCourseStudents([FromQuery] GetCourseStudentsForExamQuery query)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized();
        query.TeacherUserId = userId;
        return await Query<GetCourseStudentsForExamQuery, List<CourseStudentForExamQri>>(query);
    }

    private bool TryGetCurrentUserId(out long userId)
    {
        var claimValue = User.FindFirst("userId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return long.TryParse(claimValue, out userId);
    }
}
