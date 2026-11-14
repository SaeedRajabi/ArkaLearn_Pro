using ArkaSoftwarePro.Src.Core.Contracts.ManagedRoomStudents.ManagedRoomStudentRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.ManagedRoomStudents.Queries.GetManagedRoomStudentsPaged;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Seminars;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories;

public class ManagedRoomStudentQueryRepository(ArkaSoftwareQueryDbContext dbContext)
    : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext), IManagedRoomStudentQueryRepository
{
    public async Task<PagedData<GetManagedRoomStudentsPagedQri>?> SearchPagedAsync(GetManagedRoomStudentsPagedQuery query)
    {
        var q = _dbContext.ManagedRoomStudents.AsNoTracking().Where(x => !x.IsDelete);

        if (query.TeacherUserId is > 0)
        {
            var teacherUserId = query.TeacherUserId.Value;
            var teacherId = await _dbContext.Teachers.AsNoTracking()
                .Where(t => t.UserId == teacherUserId)
                .Select(t => (long?)t.Id)
                .FirstOrDefaultAsync();

            var eligibleIds = GetTeacherScopedManagedStudentIdsQuery(teacherId, teacherUserId);
            q = q.Where(x => eligibleIds.Contains(x.Id));
        }

        if (!string.IsNullOrWhiteSpace(query.InputValue))
        {
            var s = query.InputValue.Trim().ToLower();
            q = q.Where(x =>
                x.FirstName.ToLower().Contains(s) ||
                x.LastName.ToLower().Contains(s) ||
                x.UserName.ToLower().Contains(s) ||
                (x.Email != null && x.Email.ToLower().Contains(s)));
        }

        var result = new PagedData<GetManagedRoomStudentsPagedQri>();
        if (query.NeedTotalCount)
            result.TotalCount = await q.CountAsync();

        var ordered = query.SortAscending ? q.OrderBy(x => x.Id) : q.OrderByDescending(x => x.Id);

        result.QueryResult = await ordered
            .Skip(query.SkipCount)
            .Take(query.PageSize)
            .Select(x => new GetManagedRoomStudentsPagedQri
            {
                Id = x.Id,
                FirstName = x.FirstName,
                LastName = x.LastName,
                UserName = x.UserName,
                Email = x.Email,
                Phone = x.Phone,
                Notes = x.Notes,
                Gender = x.Gender,
                DateOfBirth = x.DateOfBirth,
                PhotoUrl = x.PhotoUrl,
            })
            .ToListAsync();

        result.PageNumber = query.PageNumber;
        result.PageSize = query.PageSize;

        return result;
    }

    private IQueryable<long> GetTeacherScopedManagedStudentIdsQuery(long? teacherId, long teacherUserId)
    {
        var fromEducationPlans = _dbContext.EducationPlans.AsNoTracking()
            .Where(p => !p.IsDelete && p.OwnerUserId == teacherUserId)
            .Select(p => p.ManagedRoomStudentId);

        var fromRoomSeats = _dbContext.RoomUsers.AsNoTracking()
            .Where(ru => ru.ManagedRoomStudentId != null &&
                         _dbContext.Rooms.AsNoTracking().Any(r => r.RoomId == ru.RoomId && r.UserId == teacherUserId))
            .Select(ru => ru.ManagedRoomStudentId!.Value);

        var fromPortalUsers = _dbContext.ManagedRoomStudents.AsNoTracking()
            .Where(m => !m.IsDelete &&
                        _dbContext.Users.AsNoTracking().Any(u =>
                            (u.UserName == m.UserName ||
                             (m.Email != null && u.Email != null && u.Email.ToLower() == m.Email.ToLower())) &&
                            (
                                (teacherId != null &&
                                 _dbContext.Enrollments.AsNoTracking().Any(e =>
                                     _dbContext.Students.AsNoTracking().Any(s => s.StudentId == e.StudentId && s.UserId == u.Id) &&
                                     _dbContext.Courses.AsNoTracking().Any(c => c.CourseId == e.CourseId && c.TeacherId == teacherId))) ||
                                _dbContext.Set<SeminarRegistrationQueryModel>().AsNoTracking().Any(reg =>
                                    reg.UserId == u.Id &&
                                    reg.SeminarId != 0 &&
                                    _dbContext.Seminars.AsNoTracking().Any(sem =>
                                        sem.Id == reg.SeminarId &&
                                        sem.RoomId != null &&
                                        _dbContext.Rooms.AsNoTracking().Any(r => r.RoomId == sem.RoomId && r.UserId == teacherUserId)))
                            )))
            .Select(m => m.Id);

        return fromEducationPlans.Union(fromRoomSeats).Union(fromPortalUsers);
    }

    public async Task<bool> IsInTeacherScopeAsync(
        long teacherUserId,
        long managedStudentId,
        CancellationToken cancellationToken = default)
    {
        if (teacherUserId <= 0 || managedStudentId <= 0)
            return false;

        var teacherId = await _dbContext.Teachers.AsNoTracking()
            .Where(t => t.UserId == teacherUserId)
            .Select(t => (long?)t.Id)
            .FirstOrDefaultAsync(cancellationToken);

        var eligibleIds = GetTeacherScopedManagedStudentIdsQuery(teacherId, teacherUserId);
        return await eligibleIds.AnyAsync(id => id == managedStudentId, cancellationToken);
    }

    public async Task<ManagedStudentPortalContact?> FindPortalContactByManagedStudentIdAsync(
        long managedStudentId,
        CancellationToken cancellationToken = default)
    {
        if (managedStudentId <= 0)
            return null;

        var managedStudent = await _dbContext.ManagedRoomStudents.AsNoTracking()
            .Where(x => x.Id == managedStudentId && !x.IsDelete)
            .Select(x => new { x.UserName, x.Email })
            .FirstOrDefaultAsync(cancellationToken);

        if (managedStudent == null)
            return null;

        var userName = managedStudent.UserName?.Trim();
        var email = managedStudent.Email?.Trim();

        if (string.IsNullOrWhiteSpace(userName) && string.IsNullOrWhiteSpace(email))
            return null;

        var userNameLower = userName?.ToLowerInvariant();
        var emailLower = email?.ToLowerInvariant();

        return await _dbContext.Users.AsNoTracking()
            .Where(u =>
                (userNameLower != null && u.UserName != null && u.UserName.ToLower() == userNameLower) ||
                (emailLower != null && u.Email != null && u.Email.ToLower() == emailLower))
            .OrderByDescending(u =>
                userNameLower != null && u.UserName != null && u.UserName.ToLower() == userNameLower ? 1 : 0)
            .Select(u => new ManagedStudentPortalContact
            {
                UserId = u.Id,
                PhoneNumber = u.PhoneNumber,
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<List<long>> GetTeacherUserIdsForManagedStudentAsync(
        long managedStudentId,
        CancellationToken cancellationToken = default)
    {
        if (managedStudentId <= 0)
            return [];

        var fromEducationPlans = _dbContext.EducationPlans.AsNoTracking()
            .Where(p => !p.IsDelete && p.ManagedRoomStudentId == managedStudentId && p.OwnerUserId > 0)
            .Select(p => p.OwnerUserId);

        var fromRoomSeats = _dbContext.RoomUsers.AsNoTracking()
            .Where(ru => ru.ManagedRoomStudentId == managedStudentId)
            .SelectMany(ru => _dbContext.Rooms.AsNoTracking()
                .Where(r => r.RoomId == ru.RoomId && r.UserId > 0)
                .Select(r => r.UserId));

        var portalUserId = await FindPortalContactByManagedStudentIdAsync(managedStudentId, cancellationToken);
        IQueryable<long> fromCourses = _dbContext.Teachers.AsNoTracking().Where(_ => false).Select(t => t.UserId);
        IQueryable<long> fromSeminars = _dbContext.Teachers.AsNoTracking().Where(_ => false).Select(t => t.UserId);

        if (portalUserId is { UserId: > 0 })
        {
            var studentUserId = portalUserId.UserId;
            fromCourses = _dbContext.Enrollments.AsNoTracking()
                .Where(e => _dbContext.Students.AsNoTracking().Any(s => s.StudentId == e.StudentId && s.UserId == studentUserId))
                .SelectMany(e => _dbContext.Courses.AsNoTracking()
                    .Where(c => c.CourseId == e.CourseId)
                    .SelectMany(c => _dbContext.Teachers.AsNoTracking()
                        .Where(t => t.Id == c.TeacherId && t.UserId > 0)
                        .Select(t => t.UserId)));

            fromSeminars = _dbContext.Set<SeminarRegistrationQueryModel>().AsNoTracking()
                .Where(reg => reg.UserId == studentUserId && reg.SeminarId != 0)
                .SelectMany(reg => _dbContext.Seminars.AsNoTracking()
                    .Where(sem => sem.Id == reg.SeminarId && sem.RoomId != null)
                    .SelectMany(sem => _dbContext.Rooms.AsNoTracking()
                        .Where(r => r.RoomId == sem.RoomId && r.UserId > 0)
                        .Select(r => r.UserId)));
        }

        return await fromEducationPlans
            .Union(fromRoomSeats)
            .Union(fromCourses)
            .Union(fromSeminars)
            .Distinct()
            .Where(id => id > 0)
            .ToListAsync(cancellationToken);
    }
}
