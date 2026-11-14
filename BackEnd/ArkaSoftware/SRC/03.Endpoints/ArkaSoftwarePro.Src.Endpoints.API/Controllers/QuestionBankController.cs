using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.QuestionBank.Commands.ClassifyBankQuestion;
using ArkaSoftwarePro.Src.Core.RequestResponse.QuestionBank.Commands.CreateBankQuestion;
using ArkaSoftwarePro.Src.Core.RequestResponse.QuestionBank.Commands.DeleteBankQuestion;
using ArkaSoftwarePro.Src.Core.RequestResponse.QuestionBank.Commands.UpdateBankQuestion;
using ArkaSoftwarePro.Src.Core.RequestResponse.QuestionBank.Queries.GetBankQuestionAnalytics;
using ArkaSoftwarePro.Src.Core.RequestResponse.QuestionBank.Queries.GetBankQuestionById;
using ArkaSoftwarePro.Src.Core.RequestResponse.QuestionBank.Queries.SearchBankQuestions;
using ArkaSoftwarePro.Src.Endpoints.API.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
public class QuestionBankController(ITeacherQueryRepository teacherQueryRepository) : BaseController
{
    [HttpPost("Create")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Create([FromBody] CreateBankQuestion command)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized();
        command.OwnerUserId = userId;
        command.IsAdmin = User.IsDashboardAdminRole();
        return await Create<CreateBankQuestion, string>(command);
    }

    [HttpPost("Update")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Update([FromBody] UpdateBankQuestion command)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized();
        command.ActorUserId = userId;
        command.IsAdmin = User.IsDashboardAdminRole();
        return await Create<UpdateBankQuestion, string>(command);
    }

    [HttpPost("Delete")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Delete([FromBody] DeleteBankQuestion command)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized();
        command.ActorUserId = userId;
        command.IsAdmin = User.IsDashboardAdminRole();
        return await Create<DeleteBankQuestion, string>(command);
    }

    [HttpPost("Classify")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Classify([FromBody] ClassifyBankQuestion command)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized();
        command.ActorUserId = userId;
        command.IsAdmin = User.IsDashboardAdminRole();
        return await Create<ClassifyBankQuestion, string>(command);
    }

    [HttpGet("Search")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Search([FromQuery] SearchBankQuestionsQuery query)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized();
        query.ActorUserId = userId;
        query.IsAdmin = User.IsDashboardAdminRole();
        query.ActorTeacherId = await teacherQueryRepository.GetTeacherIdByUserIdAsync(userId);
        return await Query<SearchBankQuestionsQuery, PagedData<BankQuestionListItemQri>>(query);
    }

    [HttpGet("GetById")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetById([FromQuery] GetBankQuestionByIdQuery query)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized();
        query.ActorUserId = userId;
        query.IsAdmin = User.IsDashboardAdminRole();
        query.IncludeCorrectAnswers = true;
        return await Query<GetBankQuestionByIdQuery, BankQuestionDetailQri>(query);
    }

    [HttpGet("Analytics")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Analytics([FromQuery] GetBankQuestionAnalyticsQuery query)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized();
        query.ActorUserId = userId;
        query.IsAdmin = User.IsDashboardAdminRole();
        query.ActorTeacherId = await teacherQueryRepository.GetTeacherIdByUserIdAsync(userId);
        return await Query<GetBankQuestionAnalyticsQuery, BankQuestionAnalyticsQri>(query);
    }

    [HttpGet("QuestionAnalytics")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> QuestionAnalytics([FromQuery] GetBankQuestionDetailAnalyticsQuery query)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized();
        query.ActorUserId = userId;
        query.IsAdmin = User.IsDashboardAdminRole();
        return await Query<GetBankQuestionDetailAnalyticsQuery, BankQuestionDetailAnalyticsQri>(query);
    }

    private bool TryGetCurrentUserId(out long userId)
    {
        userId = 0;
        var claim = User.FindFirst("userId")?.Value
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        return long.TryParse(claim, out userId);
    }
}
