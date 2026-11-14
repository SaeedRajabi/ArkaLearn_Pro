using ArkaSoftwarePro.Src.Core.ApplicationService.FileStorage;
using ArkaSoftwarePro.Src.Core.RequestResponse.Projects.Commands.AddProject;
using ArkaSoftwarePro.Src.Core.RequestResponse.Projects.Commands.DeleteProject;
using ArkaSoftwarePro.Src.Core.RequestResponse.Projects.Commands.UpdateProject;
using ArkaSoftwarePro.Src.Core.RequestResponse.Projects.Queries.GetProjectById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Projects.Queries.GetProjectBySlug;
using ArkaSoftwarePro.Src.Core.RequestResponse.Projects.Queries.SearchProjects;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
public class ProjectController(FileStoragePathSaver pathSaver) : BaseController
{
    [HttpPost("Add")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Add([FromForm] AddProject command)
        => await Create<AddProject, string>(command);

    [HttpPut("Update")]
    [HttpPost("Update")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Update([FromBody] UpdateProject command)
        => await Edit<UpdateProject, string>(command);

    [HttpDelete("Delete")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Delete([FromQuery] DeleteProjectCommand command)
        => await Edit<DeleteProjectCommand, string>(command);

    [HttpGet("GetById")]
    public async Task<IActionResult> GetById([FromQuery] GetProjectByIdQuery query)
        => await Query<GetProjectByIdQuery, ProjectQri>(query);

    [HttpGet("GetBySlug")]
    public async Task<IActionResult> GetBySlug([FromQuery] GetProjectBySlugQuery query)
        => await Query<GetProjectBySlugQuery, ProjectQri>(query);

    [HttpGet("Search")]
    public async Task<IActionResult> Search([FromQuery] SearchProjectByInputValueQuery query)
        => await Query<SearchProjectByInputValueQuery, PagedData<SearchProjectQri>>(query);

    [HttpPost("UploadThumbnail")]
    [ApiExplorerSettings(IgnoreApi = true)]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> UploadThumbnail(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("File is required.");
        var url = await pathSaver.SavePublicAsync(file, "images/projects");
        return Ok(new { url });
    }

    [HttpPost("UploadGalleryImage")]
    [ApiExplorerSettings(IgnoreApi = true)]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> UploadGalleryImage(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("File is required.");
        var url = await pathSaver.SavePublicAsync(file, "images/projects/gallery");
        return Ok(new { url });
    }

    [HttpPost("UploadIntroVideo")]
    [ApiExplorerSettings(IgnoreApi = true)]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> UploadIntroVideo(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("File is required.");
        var url = await pathSaver.SavePublicAsync(file, "projects/video");
        return Ok(new { url });
    }
}
