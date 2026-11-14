using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.Contracts.Finance.FinanceRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetMyTeacherEarningsSummary;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Queries;

public class GetMyTeacherEarningsSummaryQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherFinanceQueryRepository financeQueryRepository,
    TeacherFinanceService teacherFinanceService,
    IUserCommandRepository userCommandRepository,
    ITeacherCommandRepository teacherCommandRepository,
    IStudentCommandRepository studentCommandRepository,
    IHttpContextAccessor httpContextAccessor,
    ILogger<GetMyTeacherEarningsSummaryQueryHandler> logger)
    : QueryHandler<GetMyTeacherEarningsSummaryQuery, MyTeacherEarningsSummaryQri>(outer)
{
    public override async Task<QueryResult<MyTeacherEarningsSummaryQri>> Handle(GetMyTeacherEarningsSummaryQuery query)
    {
        var teacher = await ResolveTeacherAsync();
        if (teacher == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var summary = await financeQueryRepository.GetSummaryAsync(teacher.Id)
            ?? new MyTeacherEarningsSummaryQri();

        // Recover sales that were paid while InvoicePaid outbox events were never processed.
        if (summary.TotalSaleCount <= 0 && summary.TotalGrossSalesToman <= 0)
        {
            try
            {
                var backfill = await teacherFinanceService.BackfillCourseSalesFromPaidInvoicesAsync();
                if (backfill.NewSalesCount > 0)
                {
                    logger.LogInformation(
                        "Auto-backfilled {Sales} teacher course sales from {Invoices} paid invoices.",
                        backfill.NewSalesCount,
                        backfill.InvoicesCredited);
                    summary = await financeQueryRepository.GetSummaryAsync(teacher.Id)
                        ?? summary;
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Teacher earnings auto-backfill failed for teacher {TeacherId}", teacher.Id);
            }
        }

        return await ResultAsync(summary, ApplicationServiceStatus.Ok);
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
