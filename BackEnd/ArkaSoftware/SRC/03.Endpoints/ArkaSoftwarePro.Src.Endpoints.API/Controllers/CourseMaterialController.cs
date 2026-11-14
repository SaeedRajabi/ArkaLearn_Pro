using ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices;
using ArkaSoftwarePro.Src.Endpoints.API.Adapters.Uploads;
using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.FileStorage;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Services;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.CreateCourseCurriculumMaterial;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.DeleteCourseCurriculumMaterial;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetCourseCurriculumMaterials;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetStudentCourseCurriculumMaterials;
using ArkaSoftwarePro.Src.Endpoints.API.Common;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
public class CourseMaterialController(
    CourseMaterialDownloadService downloads) : BaseController
{
    [HttpPost("Create")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Create([FromBody] CreateCourseCurriculumMaterialCommand command)
        => await Create<CreateCourseCurriculumMaterialCommand, long>(command);

    [HttpPost("Delete")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Delete([FromBody] DeleteCourseCurriculumMaterialCommand command)
        => await Delete<DeleteCourseCurriculumMaterialCommand, string>(command);

    [HttpGet("List")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> List([FromQuery] GetCourseCurriculumMaterialsQuery query)
        => await Query<GetCourseCurriculumMaterialsQuery, List<CourseCurriculumMaterialAdminQri>>(query);

    [HttpGet("ListForStudent")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> ListForStudent([FromQuery] GetStudentCourseCurriculumMaterialsQuery query)
        => await Query<GetStudentCourseCurriculumMaterialsQuery, List<CourseCurriculumMaterialStudentQri>>(query);

    /// <summary>Streams a DirectDownload curriculum handout for enrolled students (or staff).</summary>
    [HttpGet("Download")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Download([FromQuery] long materialId, CancellationToken cancellationToken)
        => this.ToHttpResult(await downloads.Download(materialId, cancellationToken));


}
