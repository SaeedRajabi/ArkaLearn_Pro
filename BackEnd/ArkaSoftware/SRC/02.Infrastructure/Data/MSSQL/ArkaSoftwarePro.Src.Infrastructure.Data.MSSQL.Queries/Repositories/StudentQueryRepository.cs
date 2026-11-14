using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.Common;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Students.Queries.GetCourseEnrollments;
using ArkaSoftwarePro.Src.Core.RequestResponse.Students.Queries.GetStudentProfile;
using ArkaSoftwarePro.Src.Core.RequestResponse.Students.Queries.SearchPortalStudents;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories
{
    public class StudentQueryRepository(ArkaSoftwareQueryDbContext dbContext)
        : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext), IStudentQueryRepository
    {
        public async Task<PagedData<CourseEnrollmentQri>> GetCourseEnrollmentsAsync(GetCourseEnrollmentsQuery query)
        {
            // Same join pattern as GetMyCoursesAsync — no teacher joins (they can drop rows in SQL).
            var q = from e in _dbContext.Enrollments.AsNoTracking()
                    join s in _dbContext.Students.AsNoTracking() on e.StudentId equals s.StudentId
                    join u in _dbContext.Users.AsNoTracking() on s.UserId equals u.Id
                    join c in _dbContext.Courses.AsNoTracking() on e.CourseId equals c.CourseId
                    where (query.CourseId == 0 || e.CourseId == query.CourseId)
                          && (query.UserId == 0 || s.UserId == query.UserId || s.StudentId == query.UserId)
                          && (query.StudentId == 0 || s.StudentId == query.StudentId)
                    orderby e.EnrollmentDateTime descending
                    select new
                    {
                        e.Id,
                        UserId = u.Id,
                        UserFullName = u.FirstName != null || u.LastName != null
                            ? u.FirstName + " " + u.LastName
                            : null,
                        u.UserName,
                        u.Email,
                        CourseId = c.CourseId,
                        c.Title,
                        c.TeacherId,
                        e.IsActive,
                        e.EnrollmentDateTime,
                        c.DeliveryMode,
                        e.SpotPlayerLicense,
                    };

            var result = new PagedData<CourseEnrollmentQri>();
            if (query.NeedTotalCount)
                result.TotalCount = await q.CountAsync();

            var rows = await q.Skip(query.SkipCount).Take(query.PageSize).ToListAsync();

            var list = rows.Select(row => new CourseEnrollmentQri
            {
                Id = row.Id,
                UserId = row.UserId,
                UserFullName = row.UserFullName,
                UserName = row.UserName,
                Email = row.Email,
                CourseId = row.CourseId,
                CourseTitle = row.Title,
                TeacherId = row.TeacherId,
                IsActive = row.IsActive,
                EnrollmentDateTime = row.EnrollmentDateTime.ToString("yyyy/MM/dd - HH:mm"),
                DeliveryMode = row.DeliveryMode == Core.Domain.CoursesAggregate.Enumerations.CourseDeliveryMode.DesktopLicense
                    || row.DeliveryMode == Core.Domain.CoursesAggregate.Enumerations.CourseDeliveryMode.SpotPlayerLicense
                    ? "desktopLicense"
                    : "directDownload",
                SpotPlayerLicense = null,
                CanApprove = false,
            }).ToList();

            await ApplyTeacherNamesAsync(list);

            result.QueryResult = list;
            result.PageNumber = query.PageNumber;
            result.PageSize = query.PageSize;
            if (!query.NeedTotalCount)
                result.TotalCount = list.Count;
            return result;
        }

        private async Task ApplyTeacherNamesAsync(List<CourseEnrollmentQri> list)
        {
            var teacherIds = list
                .Where(x => x.TeacherId.HasValue)
                .Select(x => x.TeacherId!.Value)
                .Distinct()
                .ToList();
            if (teacherIds.Count == 0)
                return;

            var names = await (
                from t in _dbContext.Teachers.AsNoTracking()
                join tu in _dbContext.Users.AsNoTracking() on t.UserId equals tu.Id
                where teacherIds.Contains(t.Id)
                select new
                {
                    t.Id,
                    Name = ((tu.FirstName ?? string.Empty) + " " + (tu.LastName ?? string.Empty)).Trim(),
                }).ToDictionaryAsync(x => x.Id, x => x.Name);

            foreach (var item in list)
            {
                if (item.TeacherId.HasValue && names.TryGetValue(item.TeacherId.Value, out var name))
                    item.TeacherName = name;
            }
        }

        public async Task<PagedData<PortalStudentQri>> SearchPortalStudentsAsync(SearchPortalStudentsQuery query)
        {
            var search = (query.InputValue ?? string.Empty).Trim().ToLowerInvariant();

            var q = from u in _dbContext.Users.AsNoTracking()
                    join s in _dbContext.Students.AsNoTracking() on u.Id equals s.UserId
                    where u.Role == UserRole.STUDENT
                    select new { u, s };

            if (query.UserId > 0)
                q = q.Where(x => x.u.Id == query.UserId);

            if (!string.IsNullOrWhiteSpace(search))
            {
                q = q.Where(x =>
                    (x.u.UserName != null && x.u.UserName.ToLower().Contains(search)) ||
                    (x.u.Email != null && x.u.Email.ToLower().Contains(search)) ||
                    (x.u.PhoneNumber != null && x.u.PhoneNumber.Contains(search)) ||
                    (x.u.FirstName != null && x.u.FirstName.ToLower().Contains(search)) ||
                    (x.u.LastName != null && x.u.LastName.ToLower().Contains(search)));
            }

            if (query.IsActive.HasValue)
            {
                var activeStatus = UserStatus.ACTIVE.ToString();
                q = query.IsActive.Value
                    ? q.Where(x => x.u.Status == activeStatus)
                    : q.Where(x => x.u.Status != activeStatus);
            }

            var projected = q
                .OrderByDescending(x => x.u.CreateAt)
                .Select(x => new PortalStudentQri
                {
                    UserId = x.u.Id,
                    StudentId = x.s.StudentId,
                    FullName = x.u.FirstName != null || x.u.LastName != null
                        ? ((x.u.FirstName ?? string.Empty) + " " + (x.u.LastName ?? string.Empty)).Trim()
                        : x.u.UserName,
                    UserName = x.u.UserName,
                    Email = x.u.Email,
                    PhoneNumber = x.u.PhoneNumber,
                    IsActive = x.u.Status == UserStatus.ACTIVE.ToString(),
                    Status = x.u.Status ?? string.Empty,
                    CourseEnrollmentCount = _dbContext.Enrollments.Count(e => e.StudentId == x.s.StudentId),
                    RegisteredAt = x.u.CreateAt.ToString("yyyy/MM/dd"),
                });

            var result = new PagedData<PortalStudentQri>();
            if (query.NeedTotalCount)
                result.TotalCount = await projected.CountAsync();

            var list = await projected.Skip(query.SkipCount).Take(query.PageSize).ToListAsync();

            if (list.Count > 0)
            {
                var userNamesLower = list
                    .Select(x => x.UserName?.Trim().ToLowerInvariant())
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Distinct()
                    .Cast<string>()
                    .ToList();
                var emailsLower = list
                    .Select(x => x.Email?.Trim().ToLowerInvariant())
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Distinct()
                    .Cast<string>()
                    .ToList();

                var managedRows = await _dbContext.ManagedRoomStudents.AsNoTracking()
                    .Where(x => !x.IsDelete &&
                        ((!string.IsNullOrWhiteSpace(x.UserName) && userNamesLower.Contains(x.UserName.ToLower())) ||
                         (x.Email != null && emailsLower.Contains(x.Email.ToLower()))))
                    .Select(x => new { x.Id, x.UserName, x.Email })
                    .ToListAsync();

                foreach (var item in list)
                {
                    var userName = item.UserName?.Trim();
                    var email = item.Email?.Trim();
                    var match = managedRows
                        .Where(m =>
                            (!string.IsNullOrWhiteSpace(userName) &&
                             string.Equals(m.UserName, userName, StringComparison.OrdinalIgnoreCase)) ||
                            (!string.IsNullOrWhiteSpace(email) &&
                             m.Email != null &&
                             string.Equals(m.Email, email, StringComparison.OrdinalIgnoreCase)))
                        .OrderByDescending(m => m.Id)
                        .FirstOrDefault();
                    item.ManagedRoomStudentId = match?.Id;
                }
            }

            result.QueryResult = list;
            result.PageNumber = query.PageNumber;
            result.PageSize = query.PageSize;
            if (!query.NeedTotalCount)
                result.TotalCount = list.Count;
            return result;
        }

        public async Task<long?> GetStudentIdByUserIdAsync(long userId)
        {
            // Student.StudentId is FK to User.Id (1:1)
            var student = await _dbContext.Students
                .AsNoTracking()
                .Where(s => s.UserId == userId)
                .Select(s => new { s.StudentId })
                .FirstOrDefaultAsync();
            return student?.StudentId;
        }

        public async Task<long?> GetUserIdByStudentIdAsync(long studentId)
        {
            return await _dbContext.Students
                .AsNoTracking()
                .Where(s => s.StudentId == studentId)
                .Select(s => (long?)s.UserId)
                .FirstOrDefaultAsync();
        }

        public async Task<StudentProfileQri?> GetProfileByUserIdAsync(long userId)
        {
            return await (
                from s in _dbContext.Students.AsNoTracking()
                join u in _dbContext.Users.AsNoTracking() on s.UserId equals u.Id
                where s.UserId == userId
                select new StudentProfileQri
                {
                    StudentId = s.StudentId,
                    UserId = s.UserId,
                    UserName = u.UserName ?? string.Empty,
                    DisplayName = u.FirstName != null || u.LastName != null
                        ? ((u.FirstName ?? string.Empty) + " " + (u.LastName ?? string.Empty)).Trim()
                        : (u.UserName ?? string.Empty),
                    AvatarUrl = u.ProfileImage ?? string.Empty,
                    HeaderImageUrl = string.IsNullOrWhiteSpace(s.HeaderImageUrl)
                        ? DashboardProfileDefaults.HeaderImageUrl
                        : s.HeaderImageUrl,
                }).FirstOrDefaultAsync();
        }
    }
}
