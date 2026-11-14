using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.Contracts.Finance.FinanceRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetMyTeacherEarningsChart;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Queries;

public class GetMyTeacherEarningsChartQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherFinanceQueryRepository financeQueryRepository,
    IUserCommandRepository userCommandRepository,
    ITeacherCommandRepository teacherCommandRepository,
    IStudentCommandRepository studentCommandRepository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<GetMyTeacherEarningsChartQuery, List<TeacherEarningsChartPointQri>>(outer)
{
    public override async Task<QueryResult<List<TeacherEarningsChartPointQri>>> Handle(GetMyTeacherEarningsChartQuery query)
    {
        var teacher = await ResolveTeacherAsync();
        if (teacher == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var chart = await financeQueryRepository.GetChartAsync(teacher.Id, query.Period);
        return await ResultAsync(chart, ApplicationServiceStatus.Ok);
    }

    private async Task<Core.Domain.TeacherAggregate.Entities.Teacher?> ResolveTeacherAsync()
    {
        var userId = ResolveUserId();
        if (userId <= 0) return null;
        return await TeacherProfileProvisioner.EnsureTeacherRecordAsync(
            userId, userCommandRepository, teacherCommandRepository, studentCommandRepository);
    }

    private long ResolveUserId()
    {
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier || x.Type == "userId" || x.Type == "nameid");
        return claim != null && long.TryParse(claim.Value, out var id) ? id : 0;
    }
}
