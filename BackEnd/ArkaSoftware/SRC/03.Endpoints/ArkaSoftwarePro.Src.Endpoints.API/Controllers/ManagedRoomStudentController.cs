using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.FileStorage;
using ArkaSoftwarePro.Src.Endpoints.API.Common;
using ArkaSoftwarePro.Src.Core.RequestResponse.ManagedRoomStudents.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.ManagedRoomStudents.Commands.UpsertPortalStudentRoomProfile;
using ArkaSoftwarePro.Src.Core.RequestResponse.ManagedRoomStudents.Queries.GetPortalStudentRoomProfile;
using ArkaSoftwarePro.Src.Core.RequestResponse.ManagedRoomStudents.Queries.GetManagedRoomStudentsPaged;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using ArkaSoftwarePro.Src.Core.Contracts.ManagedRoomStudents.ManagedRoomStudentRepositoryContracts.Commands;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
public class ManagedRoomStudentController(FileStoragePathSaver pathSaver, ManagedRoomStudentAccessService accessService)
    : BaseController
{
    private const long MaxPhotoBytes = 5 * 1024 * 1024;

    [HttpPost("Create")]
    public async Task<IActionResult> Create([FromBody] AddManagedRoomStudentCommand command)
    {
        if (!accessService.CanCreate(User))
            return Forbid();
        return await Create<AddManagedRoomStudentCommand, long>(command);
    }

    [HttpPut("Update")]
    [HttpPost("Update")]
    public async Task<IActionResult> Update([FromBody] UpdateManagedRoomStudentCommand command)
    {
        if (!await accessService.CanManageAsync(User, command.Id))
            return Forbid();
        return await Edit<UpdateManagedRoomStudentCommand, string>(command);
    }

    [HttpDelete("Delete")]
    public async Task<IActionResult> Delete([FromQuery] long id)
    {
        if (!await accessService.CanManageAsync(User, id))
            return Forbid();
        return await Edit<DeleteManagedRoomStudentCommand, string>(new DeleteManagedRoomStudentCommand { Id = id });
    }

    [HttpGet("Search")]
    public async Task<IActionResult> Search([FromQuery] GetManagedRoomStudentsPagedQuery query)
        => await Query<GetManagedRoomStudentsPagedQuery, PagedData<GetManagedRoomStudentsPagedQri>>(query);

    [HttpGet("SearchMyStudents")]
    public async Task<IActionResult> SearchMyStudents([FromQuery] GetManagedRoomStudentsPagedQuery query)
    {
        if (!User.TryGetLongUserId(out var teacherUserId))
            return Unauthorized(new { message = "User is not authenticated." });

        query.TeacherUserId = teacherUserId;
        return await Query<GetManagedRoomStudentsPagedQuery, PagedData<GetManagedRoomStudentsPagedQri>>(query);
    }

    [HttpGet("GetPortalRoomProfile")]
    public async Task<IActionResult> GetPortalRoomProfile([FromQuery] long portalUserId)
    {
        if (!User.TryGetLongUserId(out var teacherUserId))
            return Unauthorized(new { message = "User is not authenticated." });

        return await Query<GetPortalStudentRoomProfileQuery, GetPortalStudentRoomProfileQri>(
            new GetPortalStudentRoomProfileQuery
            {
                TeacherUserId = teacherUserId,
                PortalUserId = portalUserId,
            });
    }

    [HttpPost("UpsertPortalRoomProfile")]
    public async Task<IActionResult> UpsertPortalRoomProfile([FromBody] UpsertPortalStudentRoomProfileCommand command)
    {
        if (!User.TryGetLongUserId(out var teacherUserId))
            return Unauthorized(new { message = "User is not authenticated." });

        command.TeacherUserId = teacherUserId;
        return await Edit<UpsertPortalStudentRoomProfileCommand, long>(command);
    }

    [ApiExplorerSettings(IgnoreApi = true)]
    [HttpPost("UploadPhoto")]
    [RequestSizeLimit(MaxPhotoBytes)]
    public async Task<IActionResult> UploadPhoto([FromForm] long studentId, IFormFile? photo)
    {
        if (photo == null || photo.Length == 0)
            return BadRequest(new { message = "No photo uploaded." });
        if (photo.Length > MaxPhotoBytes)
            return BadRequest(new { message = "Photo must not exceed 5 MB." });

        if (!await accessService.CanManageAsync(User, studentId))
            return Forbid();

        var repo = HttpContext.RequestServices.GetRequiredService<IManagedRoomStudentCommandRepository>();
        var entity = await repo.GetByIdOrDefaultAsync(studentId);
        if (entity == null)
            return NotFound(new { message = "Student not found." });

        var url = await pathSaver.SavePublicAsync(photo, "images/roomStudents");
        entity.Update(
            entity.FirstName,
            entity.LastName,
            entity.UserName.Value,
            entity.Email,
            null,
            entity.Phone,
            entity.Notes,
            entity.Gender,
            entity.DateOfBirth,
            url);
        await repo.CommitAsync();
        return Ok(new { photoUrl = url });
    }
}
