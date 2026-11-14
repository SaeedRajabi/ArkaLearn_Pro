using ArkaSoftwarePro.Src.Core.Contracts.EducationPlans.EducationPlanRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Queries.GetAdminInstallmentPlans;
using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Queries.GetEducationPlanById;
using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Queries.GetMyEducationPlans;
using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Queries.SearchEducationPlanWithInputValue;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.EducationPlans;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories
{
    public class EducationPlanQueryRepository(ArkaSoftwareQueryDbContext dbContext)
        : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext), IEducationPlanQueryRepository
    {
        public async Task<GetEducationPlanByIdQri?> GetEducationPlanByIdExecuteAsync(GetEducationPlanByIdQuery query)
        {
            var detail = await (
                from plan in _dbContext.EducationPlans.AsNoTracking()
                where plan.CoursePlanId == query.PlanId && !plan.IsDelete
                join student in _dbContext.ManagedRoomStudents.AsNoTracking()
                    on plan.ManagedRoomStudentId equals student.Id into studentJoin
                from student in studentJoin.DefaultIfEmpty()
                join room in _dbContext.Rooms.AsNoTracking()
                    on plan.RoomId equals room.RoomId into roomJoin
                from room in roomJoin.DefaultIfEmpty()
                join owner in _dbContext.Users.AsNoTracking()
                    on plan.OwnerUserId equals owner.Id into ownerJoin
                from owner in ownerJoin.DefaultIfEmpty()
                select new GetEducationPlanByIdQri
                {
                    PlanId = plan.CoursePlanId,
                    Title = plan.Title,
                    Description = plan.Description,
                    HourlyRate = plan.HourlyRate,
                    TotalHours = plan.TotalHours,
                    TotalCost = plan.TotalCost ?? 0,
                    ManagedRoomStudentId = plan.ManagedRoomStudentId,
                    RoomId = plan.RoomId,
                    OwnerUserId = plan.OwnerUserId,
                    OwnerFullName = owner != null ? owner.FirstName + " " + owner.LastName : null,
                    StartDateUtc = plan.StartDateUtc,
                    EndDateUtc = plan.EndDateUtc,
                    UsedMinutes = plan.UsedMinutes,
                    RemainingMinutes = Math.Max(0, plan.TotalHours * 60 - plan.UsedMinutes),
                    UsedHours = Math.Round(plan.UsedMinutes / 60m, 2),
                    RemainingHours = Math.Round(Math.Max(0, plan.TotalHours * 60 - plan.UsedMinutes) / 60m, 2),
                    StudentFullName = student != null ? student.FirstName + " " + student.LastName : null,
                    StudentUserName = student != null ? student.UserName : null,
                    RoomTitle = room != null ? room.Title : null,
                    RoomSlug = room != null ? room.Slug : null,
                    PaymentType = plan.PaymentType == 1 ? "installment" : "cash",
                    BaseTotalCostToman = plan.BaseTotalCostToman > 0 ? plan.BaseTotalCostToman : (plan.TotalCost ?? 0),
                    FinalTotalCostToman = plan.FinalTotalCostToman > 0 ? plan.FinalTotalCostToman : (plan.TotalCost ?? 0),
                }).FirstOrDefaultAsync();

            if (detail == null)
                return null;

            await EnrichDetailWithInstallmentsAsync(detail, DateTime.UtcNow, CancellationToken.None);
            return detail;
        }

        public async Task<EducationPlanInstallmentQri?> GetInstallmentByIdAsync(
            long installmentId,
            CancellationToken cancellationToken = default)
        {
            var row = await _dbContext.EducationPlanInstallments.AsNoTracking()
                .FirstOrDefaultAsync(i => i.Id == installmentId && !i.IsDelete, cancellationToken);
            if (row == null)
                return null;

            var now = DateTime.UtcNow;
            return new EducationPlanInstallmentQri
            {
                InstallmentId = row.Id,
                EducationPlanId = row.EducationPlanId,
                InstallmentNumber = row.InstallmentNumber,
                DueDateUtc = row.DueDateUtc,
                AmountToman = row.AmountToman,
                IsPaid = row.IsPaid,
                PaidAtUtc = row.PaidAtUtc,
                IsOverdue = !row.IsPaid && now > row.DueDateUtc,
            };
        }

        public async Task<PagedData<SearchEducationPlanQri>?> SearchEducationPlanExecuteAsync(SearchEducationPlanByInputValueQuery query)
        {
            var result = new PagedData<SearchEducationPlanQri>();
            var baseQuery =
                from plan in _dbContext.EducationPlans.AsNoTracking()
                where !plan.IsDelete
                join student in _dbContext.ManagedRoomStudents.AsNoTracking()
                    on plan.ManagedRoomStudentId equals student.Id into studentJoin
                from student in studentJoin.DefaultIfEmpty()
                join room in _dbContext.Rooms.AsNoTracking()
                    on plan.RoomId equals room.RoomId into roomJoin
                from room in roomJoin.DefaultIfEmpty()
                select new { plan, student, room };

            if (!string.IsNullOrWhiteSpace(query.InputValue))
            {
                var term = query.InputValue.Trim().ToLower();
                baseQuery = baseQuery.Where(x =>
                    (x.plan.Title != null && x.plan.Title.ToLower().Contains(term)) ||
                    (x.student != null && (x.student.FirstName + " " + x.student.LastName).ToLower().Contains(term)) ||
                    (x.student != null && x.student.UserName.ToLower().Contains(term)) ||
                    (x.room != null && x.room.Title != null && x.room.Title.ToLower().Contains(term)));
            }

            if (query.OwnerUserId is > 0)
                baseQuery = baseQuery.Where(x => x.plan.OwnerUserId == query.OwnerUserId.Value);

            var ordered = baseQuery.OrderByDescending(x => x.plan.StartDateUtc);

            if (query.NeedTotalCount)
                result.TotalCount = await ordered.CountAsync();

            var rows = await ordered
                .Skip(query.SkipCount)
                .Take(query.PageSize)
                .Select(x => new SearchEducationPlanQri
                {
                    Id = x.plan.CoursePlanId,
                    Title = x.plan.Title,
                    HourlyRate = x.plan.HourlyRate,
                    TotalCost = x.plan.TotalCost,
                    TotalHours = x.plan.TotalHours,
                    ManagedRoomStudentId = x.plan.ManagedRoomStudentId,
                    RoomId = x.plan.RoomId,
                    StartDateUtc = x.plan.StartDateUtc,
                    EndDateUtc = x.plan.EndDateUtc,
                    UsedMinutes = x.plan.UsedMinutes,
                    RemainingMinutes = Math.Max(0, x.plan.TotalHours * 60 - x.plan.UsedMinutes),
                    StudentFullName = x.student != null ? x.student.FirstName + " " + x.student.LastName : null,
                    RoomTitle = x.room != null ? x.room.Title : null,
                })
                .ToListAsync();

            result.QueryResult = rows;
            return result;
        }

        public async Task<List<long>> ResolveManagedStudentIdsForUserAsync(
            long userId,
            string userName,
            string? email,
            CancellationToken cancellationToken = default)
        {
            var normalizedUserName = (userName ?? string.Empty).Trim();
            var normalizedEmail = (email ?? string.Empty).Trim();

            var fromCatalog = _dbContext.ManagedRoomStudents.AsNoTracking()
                .Where(s =>
                    !s.IsDelete &&
                    (s.UserName == normalizedUserName ||
                     (!string.IsNullOrEmpty(normalizedEmail) &&
                      s.Email != null &&
                      s.Email.ToLower() == normalizedEmail.ToLower())))
                .Select(s => s.Id);

            // Match room seats by portal login (username/email), not by seat Id (RoomUserQueryModel.UserId maps to seat PK).
            var fromRoomSeats = _dbContext.RoomUsers.AsNoTracking()
                .Where(ru =>
                    ru.ManagedRoomStudentId != null &&
                    ((!string.IsNullOrEmpty(normalizedUserName) && ru.UserName == normalizedUserName) ||
                     (!string.IsNullOrEmpty(normalizedEmail) &&
                      ru.Email != null &&
                      ru.Email.ToLower() == normalizedEmail.ToLower())))
                .Select(ru => ru.ManagedRoomStudentId!.Value);

            return await fromCatalog.Union(fromRoomSeats).Distinct().ToListAsync(cancellationToken);
        }

        public async Task<List<MyEducationPlanQri>> GetMyEducationPlansAsync(
            IReadOnlyList<long> managedStudentIds,
            CancellationToken cancellationToken = default)
        {
            if (managedStudentIds.Count == 0)
                return [];

            var now = DateTime.UtcNow;
            var ids = managedStudentIds.ToList();

            var plans = await (
                from plan in _dbContext.EducationPlans.AsNoTracking()
                where !plan.IsDelete && ids.Contains(plan.ManagedRoomStudentId)
                join room in _dbContext.Rooms.AsNoTracking()
                    on plan.RoomId equals room.RoomId into roomJoin
                from room in roomJoin.DefaultIfEmpty()
                join owner in _dbContext.Users.AsNoTracking()
                    on plan.OwnerUserId equals owner.Id into ownerJoin
                from owner in ownerJoin.DefaultIfEmpty()
                orderby plan.StartDateUtc descending
                select new MyEducationPlanQri
                {
                    PlanId = plan.CoursePlanId,
                    Title = plan.Title,
                    PlanTypeLabel = plan.TotalHours + "h private",
                    StartDateUtc = plan.StartDateUtc,
                    EndDateUtc = plan.EndDateUtc,
                    TotalHours = plan.TotalHours,
                    UsedMinutes = plan.UsedMinutes,
                    RemainingMinutes = Math.Max(0, plan.TotalHours * 60 - plan.UsedMinutes),
                    RemainingHours = Math.Round(
                        Math.Max(0, plan.TotalHours * 60 - plan.UsedMinutes) / 60m,
                        2),
                    RoomId = plan.RoomId,
                    RoomTitle = room != null ? room.Title : null,
                    RoomSlug = room != null ? room.Slug : null,
                    IsActive = now >= plan.StartDateUtc &&
                               now <= plan.EndDateUtc &&
                               plan.UsedMinutes < plan.TotalHours * 60,
                    OwnerUserId = plan.OwnerUserId,
                    OwnerFullName = owner != null ? owner.FirstName + " " + owner.LastName : null,
                    PaymentType = plan.PaymentType == 1 ? "installment" : "cash",
                    BaseTotalCostToman = plan.BaseTotalCostToman > 0 ? plan.BaseTotalCostToman : (plan.TotalCost ?? 0),
                    FinalTotalCostToman = plan.FinalTotalCostToman > 0 ? plan.FinalTotalCostToman : (plan.TotalCost ?? 0),
                }).ToListAsync(cancellationToken);

            await EnrichPlansWithInstallmentsAsync(plans, now, cancellationToken);
            return plans;
        }

        public async Task<GetEducationPlanByIdQri?> GetEducationPlanForStudentAsync(
            long planId,
            IReadOnlyList<long> managedStudentIds,
            CancellationToken cancellationToken = default)
        {
            if (managedStudentIds.Count == 0)
                return null;

            var ids = managedStudentIds.ToList();

            var detail = await (
                from plan in _dbContext.EducationPlans.AsNoTracking()
                where plan.CoursePlanId == planId &&
                      !plan.IsDelete &&
                      ids.Contains(plan.ManagedRoomStudentId)
                join student in _dbContext.ManagedRoomStudents.AsNoTracking()
                    on plan.ManagedRoomStudentId equals student.Id into studentJoin
                from student in studentJoin.DefaultIfEmpty()
                join room in _dbContext.Rooms.AsNoTracking()
                    on plan.RoomId equals room.RoomId into roomJoin
                from room in roomJoin.DefaultIfEmpty()
                join owner in _dbContext.Users.AsNoTracking()
                    on plan.OwnerUserId equals owner.Id into ownerJoin
                from owner in ownerJoin.DefaultIfEmpty()
                select new GetEducationPlanByIdQri
                {
                    PlanId = plan.CoursePlanId,
                    Title = plan.Title,
                    Description = plan.Description,
                    HourlyRate = plan.HourlyRate,
                    TotalHours = plan.TotalHours,
                    TotalCost = plan.TotalCost ?? 0,
                    ManagedRoomStudentId = plan.ManagedRoomStudentId,
                    RoomId = plan.RoomId,
                    OwnerUserId = plan.OwnerUserId,
                    OwnerFullName = owner != null ? owner.FirstName + " " + owner.LastName : null,
                    StartDateUtc = plan.StartDateUtc,
                    EndDateUtc = plan.EndDateUtc,
                    UsedMinutes = plan.UsedMinutes,
                    RemainingMinutes = Math.Max(0, plan.TotalHours * 60 - plan.UsedMinutes),
                    UsedHours = Math.Round(plan.UsedMinutes / 60m, 2),
                    RemainingHours = Math.Round(
                        Math.Max(0, plan.TotalHours * 60 - plan.UsedMinutes) / 60m,
                        2),
                    StudentFullName = student != null ? student.FirstName + " " + student.LastName : null,
                    StudentUserName = student != null ? student.UserName : null,
                    RoomTitle = room != null ? room.Title : null,
                    RoomSlug = room != null ? room.Slug : null,
                    PaymentType = plan.PaymentType == 1 ? "installment" : "cash",
                    BaseTotalCostToman = plan.BaseTotalCostToman > 0 ? plan.BaseTotalCostToman : (plan.TotalCost ?? 0),
                    FinalTotalCostToman = plan.FinalTotalCostToman > 0 ? plan.FinalTotalCostToman : (plan.TotalCost ?? 0),
                }).FirstOrDefaultAsync(cancellationToken);

            if (detail == null)
                return null;

            var now = DateTime.UtcNow;
            await EnrichDetailWithInstallmentsAsync(detail, now, cancellationToken);
            return detail;
        }

        private async Task EnrichDetailWithInstallmentsAsync(
            GetEducationPlanByIdQri detail,
            DateTime now,
            CancellationToken cancellationToken)
        {
            var installments = await LoadInstallmentRowsAsync([detail.PlanId], cancellationToken);
            ApplyInstallmentsToDetail(detail, installments, now);
        }

        private async Task EnrichPlansWithInstallmentsAsync(
            List<MyEducationPlanQri> plans,
            DateTime now,
            CancellationToken cancellationToken)
        {
            if (plans.Count == 0) return;
            var planIds = plans.Select(p => p.PlanId).ToList();
            var installments = await LoadInstallmentRowsAsync(planIds, cancellationToken);
            foreach (var plan in plans)
            {
                var rows = installments.Where(i => i.EducationPlanId == plan.PlanId).ToList();
                plan.Installments = MapInstallments(rows, now);
                plan.PaymentBlocked = plan.PaymentType == "installment" && plan.Installments.Any(i => i.IsOverdue);
                if (plan.PaymentBlocked)
                    plan.IsActive = false;
            }
        }

        private async Task<List<EducationPlanInstallmentQueryModel>> LoadInstallmentRowsAsync(
            IReadOnlyList<long> planIds,
            CancellationToken cancellationToken) =>
            await _dbContext.EducationPlanInstallments.AsNoTracking()
                .Where(i => !i.IsDelete && planIds.Contains(i.EducationPlanId))
                .OrderBy(i => i.InstallmentNumber)
                .ToListAsync(cancellationToken);

        private static List<EducationPlanInstallmentQri> MapInstallments(
            IReadOnlyList<EducationPlanInstallmentQueryModel> rows,
            DateTime now) =>
            rows.Select(i => new EducationPlanInstallmentQri
            {
                InstallmentId = i.Id,
                EducationPlanId = i.EducationPlanId,
                InstallmentNumber = i.InstallmentNumber,
                DueDateUtc = i.DueDateUtc,
                AmountToman = i.AmountToman,
                IsPaid = i.IsPaid,
                PaidAtUtc = i.PaidAtUtc,
                IsOverdue = !i.IsPaid && now > i.DueDateUtc,
            }).ToList();

        private static void ApplyInstallmentsToDetail(
            GetEducationPlanByIdQri detail,
            IReadOnlyList<EducationPlanInstallmentQueryModel> rows,
            DateTime now)
        {
            detail.Installments = MapInstallments(rows.Where(r => r.EducationPlanId == detail.PlanId).ToList(), now);
            detail.PaymentBlocked = detail.PaymentType == "installment" && detail.Installments.Any(i => i.IsOverdue);
        }

        public async Task<bool> IsPlanActiveAsync(long planId, CancellationToken cancellationToken = default)
        {
            var now = DateTime.UtcNow;
            var plan = await _dbContext.EducationPlans.AsNoTracking()
                .FirstOrDefaultAsync(
                    p => p.CoursePlanId == planId && !p.IsDelete,
                    cancellationToken);
            if (plan == null)
                return false;

            var timeActive = now >= plan.StartDateUtc &&
                             now <= plan.EndDateUtc &&
                             plan.UsedMinutes < plan.TotalHours * 60;
            if (!timeActive)
                return false;

            if (plan.PaymentType != 1)
                return true;

            var hasOverdue = await _dbContext.EducationPlanInstallments.AsNoTracking()
                .AnyAsync(
                    i => !i.IsDelete &&
                         i.EducationPlanId == planId &&
                         !i.IsPaid &&
                         i.DueDateUtc < now,
                    cancellationToken);
            return !hasOverdue;
        }

        public async Task<List<AdminEducationPlanInstallmentListItemQri>> GetInstallmentPlansForAdminAsync(
            CancellationToken cancellationToken = default)
        {
            var now = DateTime.UtcNow;
            var plans = await (
                from plan in _dbContext.EducationPlans.AsNoTracking()
                where !plan.IsDelete && plan.PaymentType == 1
                join student in _dbContext.ManagedRoomStudents.AsNoTracking()
                    on plan.ManagedRoomStudentId equals student.Id into studentJoin
                from student in studentJoin.DefaultIfEmpty()
                join room in _dbContext.Rooms.AsNoTracking()
                    on plan.RoomId equals room.RoomId into roomJoin
                from room in roomJoin.DefaultIfEmpty()
                join owner in _dbContext.Users.AsNoTracking()
                    on plan.OwnerUserId equals owner.Id into ownerJoin
                from owner in ownerJoin.DefaultIfEmpty()
                orderby plan.StartDateUtc descending
                select new
                {
                    Plan = plan,
                    StudentName = student != null ? ((student.FirstName ?? "") + " " + (student.LastName ?? "")).Trim() : "",
                    StudentUserName = student != null ? student.UserName : null,
                    TeacherName = owner != null ? ((owner.FirstName ?? "") + " " + (owner.LastName ?? "")).Trim() : null,
                    RoomTitle = room != null ? room.Title : null,
                })
                .Take(500)
                .ToListAsync(cancellationToken);

            if (plans.Count == 0)
                return new List<AdminEducationPlanInstallmentListItemQri>();

            var planIds = plans.Select(p => p.Plan.CoursePlanId).ToList();
            var installments = await LoadInstallmentRowsAsync(planIds, cancellationToken);

            return plans
                .Select(row =>
                {
                    var rows = installments
                        .Where(i => i.EducationPlanId == row.Plan.CoursePlanId)
                        .OrderBy(i => i.InstallmentNumber)
                        .ToList();

                    if (rows.Count == 0)
                        return null;

                    var totalAmount = rows.Sum(i => i.AmountToman);
                    var paidAmount = rows.Where(i => i.IsPaid).Sum(i => i.AmountToman);
                    var finalTotal = row.Plan.FinalTotalCostToman > 0
                        ? row.Plan.FinalTotalCostToman
                        : (row.Plan.TotalCost ?? totalAmount);

                    return new AdminEducationPlanInstallmentListItemQri
                    {
                        PlanId = row.Plan.CoursePlanId,
                        PlanTitle = row.Plan.Title ?? $"Plan #{row.Plan.CoursePlanId}",
                        ManagedRoomStudentId = row.Plan.ManagedRoomStudentId,
                        StudentName = string.IsNullOrWhiteSpace(row.StudentName) ? "—" : row.StudentName,
                        StudentUserName = row.StudentUserName,
                        OwnerUserId = row.Plan.OwnerUserId,
                        TeacherName = string.IsNullOrWhiteSpace(row.TeacherName) ? null : row.TeacherName,
                        RoomTitle = row.RoomTitle,
                        StartDateUtc = row.Plan.StartDateUtc,
                        EndDateUtc = row.Plan.EndDateUtc,
                        FinalTotalCostToman = finalTotal,
                        InstallmentCount = rows.Count,
                        PaidInstallmentCount = rows.Count(i => i.IsPaid),
                        TotalAmount = totalAmount,
                        PaidAmount = paidAmount,
                        RemainingAmount = Math.Max(0, totalAmount - paidAmount),
                        Installments = rows.Select(i => new AdminInstallmentItemQri
                        {
                            Id = i.Id,
                            Number = i.InstallmentNumber,
                            Amount = i.AmountToman,
                            DueDate = i.DueDateUtc,
                            IsPaid = i.IsPaid,
                            PaidDate = i.PaidAtUtc,
                            PaymentReference = i.PaymentReference,
                            IsOverdue = !i.IsPaid && now > i.DueDateUtc,
                        }).ToList(),
                    };
                })
                .Where(x => x != null)
                .Cast<AdminEducationPlanInstallmentListItemQri>()
                .ToList();
        }
    }
}
