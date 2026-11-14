using ArkaSoftwarePro.Src.Core.Contracts.EducationPlans.EducationPlanRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.EducationPlanAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories
{
    public class EducationPlanCommandRepository(ArkaSoftwareCommandDbContext dbContext)
        : BaseCommandRepository<EducationPlan, ArkaSoftwareCommandDbContext>(dbContext), IEducationPlanCommandRepository
    {
        public Task<EducationPlan?> GetByIdWithUsagesAsync(long planId, CancellationToken cancellationToken = default) =>
            _dbContext.EducationPlans
                .Include(p => p.SessionUsages)
                .Include(p => p.Installments)
                .FirstOrDefaultAsync(p => p.Id == planId && !p.IsDelete, cancellationToken);

        public Task<EducationPlan?> GetByIdWithInstallmentsAsync(long planId, CancellationToken cancellationToken = default) =>
            _dbContext.EducationPlans
                .Include(p => p.Installments)
                .FirstOrDefaultAsync(p => p.Id == planId && !p.IsDelete, cancellationToken);

        public Task<EducationPlanInstallment?> GetInstallmentByIdAsync(long installmentId, CancellationToken cancellationToken = default) =>
            _dbContext.Set<EducationPlanInstallment>()
                .Include(i => i.EducationPlan)
                .FirstOrDefaultAsync(i => i.Id == installmentId && !i.IsDelete, cancellationToken);

        public Task<List<EducationPlanInstallment>> GetDueInstallmentRemindersAsync(
            DateTime dueByUtc,
            CancellationToken cancellationToken = default) =>
            _dbContext.Set<EducationPlanInstallment>()
                .Include(i => i.EducationPlan)
                .Where(i =>
                    !i.IsDelete &&
                    !i.IsPaid &&
                    i.ReminderSentAtUtc == null &&
                    i.DueDateUtc <= dueByUtc &&
                    i.EducationPlan != null &&
                    !i.EducationPlan.IsDelete)
                .ToListAsync(cancellationToken);

        public Task<List<EducationPlanInstallment>> GetUnpaidInstallmentsForDueDateRangeAsync(
            DateTime fromDueUtcInclusive,
            DateTime toDueUtcInclusive,
            CancellationToken cancellationToken = default) =>
            _dbContext.Set<EducationPlanInstallment>()
                .Include(i => i.EducationPlan)
                .Where(i =>
                    !i.IsDelete &&
                    !i.IsPaid &&
                    i.DueDateUtc >= fromDueUtcInclusive &&
                    i.DueDateUtc <= toDueUtcInclusive &&
                    i.EducationPlan != null &&
                    !i.EducationPlan.IsDelete)
                .ToListAsync(cancellationToken);

        public Task<List<EducationPlan>> GetActivePlansForRoomAtAsync(
            long roomId,
            DateTime sessionStartUtc,
            CancellationToken cancellationToken = default) =>
            _dbContext.EducationPlans
                .Include(p => p.SessionUsages)
                .Where(p =>
                    !p.IsDelete &&
                    p.RoomId == roomId &&
                    p.StartDateUtc <= sessionStartUtc &&
                    p.EndDateUtc >= sessionStartUtc &&
                    p.UsedMinutes < p.TotalHours * 60)
                .ToListAsync(cancellationToken);
    }
}
