using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.Contracts.Software.SoftwareRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Software.Queries.GetMySoftware;
using ArkaSoftwarePro.Src.Core.RequestResponse.Software.Queries.GetSoftwareBySlug;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SoftwareServices.Queries;

public class GetMySoftwareQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ISoftwareCommandRepository softwareRepository,
    ITeacherCommandRepository teacherCommandRepository,
    IUserCommandRepository userCommandRepository,
    IStudentCommandRepository studentCommandRepository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<GetMySoftwareQuery, List<SoftwarePublicQri>>(outer)
{
    public override async Task<QueryResult<List<SoftwarePublicQri>>> Handle(GetMySoftwareQuery query)
    {
        if (!TryGetUserId(out var userId))
            return await ResultAsync([], ApplicationServiceStatus.Ok);

        var teacher = await TeacherProfileProvisioner.EnsureTeacherRecordAsync(
            userId, userCommandRepository, teacherCommandRepository, studentCommandRepository);
        if (teacher == null)
            return await ResultAsync([], ApplicationServiceStatus.Ok);

        var items = await softwareRepository.GetByTeacherIdAsync(teacher.Id);
        var result = new List<SoftwarePublicQri>();
        foreach (var item in items)
        {
            var categoryPath = await softwareRepository.GetCategoryPathAsync(item.CategoryId);
            result.Add(SoftwareMapper.ToPublicQri(item, false, categoryPath));
        }

        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }

    private bool TryGetUserId(out long userId)
    {
        userId = 0;
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier || x.Type == "userId" || x.Type == "nameid");
        return claim != null && long.TryParse(claim.Value, out userId) && userId > 0;
    }
}
