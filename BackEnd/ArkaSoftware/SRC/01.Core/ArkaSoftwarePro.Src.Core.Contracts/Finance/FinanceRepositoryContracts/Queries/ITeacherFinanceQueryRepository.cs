using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetMyTeacherCourseSales;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetMyTeacherEarningsChart;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetMyTeacherEarningsSummary;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetMyTeacherPayouts;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherPayoutQueue;

namespace ArkaSoftwarePro.Src.Core.Contracts.Finance.FinanceRepositoryContracts.Queries;

public interface ITeacherFinanceQueryRepository
{
    Task<MyTeacherEarningsSummaryQri?> GetSummaryAsync(long teacherId, CancellationToken cancellationToken = default);
    Task<List<TeacherEarningsChartPointQri>> GetChartAsync(long teacherId, string period, CancellationToken cancellationToken = default);
    Task<List<TeacherCourseSaleQri>> GetRecentSalesAsync(long teacherId, int take, CancellationToken cancellationToken = default);
    Task<List<TeacherPayoutQri>> GetPayoutsAsync(long teacherId, int take, CancellationToken cancellationToken = default);
    Task<List<AdminTeacherPayoutQri>> GetAdminPayoutQueueAsync(string? status, int take, CancellationToken cancellationToken = default);
}
