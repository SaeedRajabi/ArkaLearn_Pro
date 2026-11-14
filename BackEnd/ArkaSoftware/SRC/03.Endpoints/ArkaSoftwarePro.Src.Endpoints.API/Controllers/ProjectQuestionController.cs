using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.ApplicationService.FileStorage;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectQuestions.Commands.LikeProjectAnswer;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectQuestions.Commands.ReviewProjectQuestion;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectQuestions.Commands.SubmitProjectAnswer;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectQuestions.Commands.SubmitProjectQuestion;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectQuestions.Queries.GetProjectQuestionById;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectQuestions.Queries.GetProjectQuestionsByProjectId;
using ProjectQuestionQri = ArkaSoftwarePro.Src.Core.RequestResponse.ProjectQuestions.Queries.GetProjectQuestionsByProjectId.ProjectQuestionQri;
using ProjectQuestionDetailQri = ArkaSoftwarePro.Src.Core.RequestResponse.ProjectQuestions.Queries.GetProjectQuestionById.ProjectQuestionDetailQri;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectQuestions.Queries.SearchProjectQuestions;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
[ApiController]
public class ProjectQuestionController(FileStoragePathSaver pathSaver) : BaseController
{
    [HttpGet("GetByProjectId")]
    public async Task<IActionResult> GetByProjectId([FromQuery] long projectId)
    {
        long? userId = TryGetCurrentUserId(out var uid) ? uid : null;
        return await Query<GetProjectQuestionsByProjectIdQuery, List<ProjectQuestionQri>>(
            new GetProjectQuestionsByProjectIdQuery { ProjectId = projectId, CurrentUserId = userId });
    }

    [HttpGet("GetById")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetById([FromQuery] long questionId)
        => await Query<GetProjectQuestionByIdQuery, ProjectQuestionDetailQri>(
            new GetProjectQuestionByIdQuery { QuestionId = questionId });

    [HttpGet("Search")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Search([FromQuery] SearchProjectQuestionsQuery query)
        => await Query<SearchProjectQuestionsQuery, PagedData<SearchProjectQuestionQri>>(query);

    [HttpPost("Submit")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Submit([FromBody] SubmitProjectQuestionCommand command)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "User is not authenticated." });
        command.UserId = userId;
        return await Create<SubmitProjectQuestionCommand, string>(command);
    }

    [HttpPost("SubmitAnswer")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> SubmitAnswer([FromBody] SubmitProjectAnswerCommand command)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "User is not authenticated." });
        command.UserId = userId;
        return await Create<SubmitProjectAnswerCommand, string>(command);
    }

    [HttpPut("Review")]
    [HttpPost("Review")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Review([FromBody] ReviewProjectQuestionCommand command)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "User is not authenticated." });
        command.ReviewerUserId = userId;
        return await Edit<ReviewProjectQuestionCommand, string>(command);
    }

    [HttpPut("LikeAnswer")]
    [HttpPost("LikeAnswer")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> LikeAnswer([FromBody] LikeProjectAnswerCommand command)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "User is not authenticated." });
        command.UserId = userId;
        return await Edit<LikeProjectAnswerCommand, string>(command);
    }

    [HttpPost("UploadImage")]
    [ApiExplorerSettings(IgnoreApi = true)]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("File is required.");
        var url = await pathSaver.SavePublicAsync(file, "images/project-questions");
        return Ok(new { url });
    }

    [HttpPost("UploadAudio")]
    [ApiExplorerSettings(IgnoreApi = true)]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> UploadAudio(IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("File is required.");
        var url = await pathSaver.SavePublicAsync(file, "audio/project-questions");
        return Ok(new { url });
    }

    private bool TryGetCurrentUserId(out long userId)
    {
        var claimValue = User.FindFirst("userId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return long.TryParse(claimValue, out userId);
    }
}
