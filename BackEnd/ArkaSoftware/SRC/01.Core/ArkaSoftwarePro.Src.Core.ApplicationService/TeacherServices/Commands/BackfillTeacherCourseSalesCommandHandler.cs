using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.BackfillTeacherCourseSales;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Commands;

public class BackfillTeacherCourseSalesCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    TeacherFinanceService financeService,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<BackfillTeacherCourseSalesCommand, BackfillTeacherCourseSalesResult>(outer)
{
    public override async Task<CommandResult<BackfillTeacherCourseSalesResult>> Handle(BackfillTeacherCourseSalesCommand command)
    {
        if (!IsAdminUser())
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var result = await financeService.BackfillCourseSalesFromPaidInvoicesAsync();
        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }

    private bool IsAdminUser()
    {
        var roleClaim = httpContextAccessor.HttpContext?.User?.Claims?
            .FirstOrDefault(x => x.Type == ClaimTypes.Role)?.Value;
        return roleClaim?.ToLowerInvariant() is "3" or "admin" or "super admin";
    }
}
