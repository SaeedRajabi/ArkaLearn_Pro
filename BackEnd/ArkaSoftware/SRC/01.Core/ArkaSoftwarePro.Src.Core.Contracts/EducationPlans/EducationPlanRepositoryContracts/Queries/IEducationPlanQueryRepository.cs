using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Queries.GetAdminInstallmentPlans;
using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Queries.GetEducationPlanById;
using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Queries.GetMyEducationPlans;
using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Queries.SearchEducationPlanWithInputValue;
using Framework.Src.Core.Contracts.Data.Queries;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.EducationPlans.EducationPlanRepositoryContracts.Queries
{
    public interface IEducationPlanQueryRepository:IQueryRepository
    {
        Task<GetEducationPlanByIdQri?> GetEducationPlanByIdExecuteAsync(GetEducationPlanByIdQuery query);
        Task<PagedData<SearchEducationPlanQri>?> SearchEducationPlanExecuteAsync(SearchEducationPlanByInputValueQuery query);
        Task<List<long>> ResolveManagedStudentIdsForUserAsync(long userId, string userName, string? email, CancellationToken cancellationToken = default);
        Task<List<MyEducationPlanQri>> GetMyEducationPlansAsync(IReadOnlyList<long> managedStudentIds, CancellationToken cancellationToken = default);
        Task<GetEducationPlanByIdQri?> GetEducationPlanForStudentAsync(long planId, IReadOnlyList<long> managedStudentIds, CancellationToken cancellationToken = default);
        Task<EducationPlanInstallmentQri?> GetInstallmentByIdAsync(long installmentId, CancellationToken cancellationToken = default);
        Task<bool> IsPlanActiveAsync(long planId, CancellationToken cancellationToken = default);
        Task<List<AdminEducationPlanInstallmentListItemQri>> GetInstallmentPlansForAdminAsync(CancellationToken cancellationToken = default);
    }
}
