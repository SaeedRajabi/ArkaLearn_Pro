using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherPayoutBankInfo;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Queries;

public class GetTeacherPayoutBankInfoQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherCommandRepository teacherCommandRepository,
    IUserCommandRepository userCommandRepository,
    IStudentCommandRepository studentCommandRepository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<GetTeacherPayoutBankInfoQuery, TeacherPayoutBankInfoQri>(outer)
{
    public override async Task<QueryResult<TeacherPayoutBankInfoQri>> Handle(GetTeacherPayoutBankInfoQuery query)
    {
        var userId = ResolveUserId();
        if (userId <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var teacher = await TeacherProfileProvisioner.EnsureTeacherRecordAsync(
            userId, userCommandRepository, teacherCommandRepository, studentCommandRepository);
        if (teacher == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        return await ResultAsync(new TeacherPayoutBankInfoQri
        {
            PayoutSheba = teacher.PayoutSheba,
            PayoutCardNumber = teacher.PayoutCardNumber,
            HasCompleteBankInfo = teacher.HasCompletePayoutBankInfo(),
        });
    }

    private long ResolveUserId()
    {
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier || x.Type == "userId" || x.Type == "nameid");
        return claim != null && long.TryParse(claim.Value, out var id) ? id : 0;
    }
}
