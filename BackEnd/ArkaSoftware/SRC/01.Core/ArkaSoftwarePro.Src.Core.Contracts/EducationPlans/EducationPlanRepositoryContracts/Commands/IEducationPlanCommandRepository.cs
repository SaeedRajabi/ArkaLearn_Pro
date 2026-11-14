using ArkaSoftwarePro.Src.Core.Domain.EducationPlanAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.EducationPlans.EducationPlanRepositoryContracts.Commands;

public interface IEducationPlanCommandRepository : ICommandRepository<EducationPlan, long>
{
    Task<EducationPlan?> GetByIdWithUsagesAsync(long planId, CancellationToken cancellationToken = default);
    Task<EducationPlan?> GetByIdWithInstallmentsAsync(long planId, CancellationToken cancellationToken = default);
    Task<EducationPlanInstallment?> GetInstallmentByIdAsync(long installmentId, CancellationToken cancellationToken = default);
    Task<List<EducationPlanInstallment>> GetDueInstallmentRemindersAsync(
        DateTime dueByUtc,
        CancellationToken cancellationToken = default);

    Task<List<EducationPlanInstallment>> GetUnpaidInstallmentsForDueDateRangeAsync(
        DateTime fromDueUtcInclusive,
        DateTime toDueUtcInclusive,
        CancellationToken cancellationToken = default);

    Task<List<EducationPlan>> GetActivePlansForRoomAtAsync(
        long roomId,
        DateTime sessionStartUtc,
        CancellationToken cancellationToken = default);
}
