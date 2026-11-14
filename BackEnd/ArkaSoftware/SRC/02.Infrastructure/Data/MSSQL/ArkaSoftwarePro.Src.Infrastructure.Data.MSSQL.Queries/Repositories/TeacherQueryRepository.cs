using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.Common;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetPendingTeacherProfiles;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherProfile;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherTeachingCategories;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.SearchTeachers;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Microsoft.EntityFrameworkCore;
namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories;

public class TeacherQueryRepository(ArkaSoftwareQueryDbContext dbContext) :
    BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext), ITeacherQueryRepository
{
    public async Task<long?> GetTeacherIdByUserIdAsync(long userId)
    {
        return await _dbContext.Teachers
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => (long?)x.Id)
            .FirstOrDefaultAsync();
    }

    public async Task<long?> GetUserIdByTeacherIdAsync(long teacherId)
    {
        return await _dbContext.Teachers
            .AsNoTracking()
            .Where(x => x.Id == teacherId)
            .Select(x => (long?)x.UserId)
            .FirstOrDefaultAsync();
    }

    public async Task<TeacherProfileQri?> GetProfileAsync(GetTeacherProfileQuery query, bool includeUnapproved = false)
    {
        var teacherQuery = _dbContext.Teachers.AsNoTracking().AsQueryable();

        if (query.TeacherId is > 0)
            teacherQuery = teacherQuery.Where(t => t.Id == query.TeacherId.Value);
        else if (!string.IsNullOrWhiteSpace(query.UserName))
        {
            var normalizedUserName = query.UserName.Trim().ToLowerInvariant();
            teacherQuery = teacherQuery.Where(t =>
                t.User != null &&
                t.User.UserName != null &&
                t.User.UserName.ToLower() == normalizedUserName);
        }
        else
            return null;

        if (!includeUnapproved)
        {
            teacherQuery = teacherQuery.Where(t =>
                t.ProfileApprovalStatus == (byte)TeacherApprovalStatus.Approved
                || t.AccountStatus == (byte)TeacherAccountStatus.Terminated);
        }

        var teacher = await teacherQuery
            .Include(t => t.User)
            .Include(t => t.TeachingCategory)
            .Include(t => t.TeacherEducations)
            .Include(t => t.ExpertiseAreas)
            .Include(t => t.Courses.Where(c => c.IsPublish && c.ModerationStatus == TeacherApprovalStatus.Approved))
            .FirstOrDefaultAsync();

        if (teacher == null)
            return null;

        var stats = await GetProfileStatsAsync(teacher.Id, teacher.UserId);
        var user = teacher.User;
        var displayName = user != null ? $"{user.FirstName} {user.LastName}".Trim() : string.Empty;
        var userName = user?.UserName ?? string.Empty;
        var avatar = !string.IsNullOrWhiteSpace(user?.ProfileImage)
            ? user!.ProfileImage!
            : BuildAvatarPlaceholder(userName);
        var canShowContact = teacher.AdvertisingPlan == (byte)TeacherAdvertisingPlan.Paid;

        return new TeacherProfileQri
        {
            TeacherId = teacher.Id,
            UserId = teacher.UserId,
            DisplayName = displayName,
            UserName = userName,
            AvatarUrl = avatar,
            Headline = teacher.TeacherEducations.FirstOrDefault()?.NameOfInstitutionOrUniversity ?? string.Empty,
            ShortDescription = teacher.ShortDescription ?? string.Empty,
            LongDescription = teacher.LongDescription ?? string.Empty,
            HeaderImageUrl = string.IsNullOrWhiteSpace(teacher.HeaderImageUrl)
                ? DashboardProfileDefaults.HeaderImageUrl
                : teacher.HeaderImageUrl,
            TeachingCategoryId = teacher.TeachingCategoryId,
            TeachingCategoryName = teacher.TeachingCategory?.Name ?? string.Empty,
            TeachingCategorySlug = teacher.TeachingCategory?.Slug ?? string.Empty,
            AdvertisingPlan = teacher.AdvertisingPlan == (byte)TeacherAdvertisingPlan.Paid ? "paid" : "free",
            ProfileApprovalStatus = MapApprovalStatus(teacher.ProfileApprovalStatus),
            ProfileRejectionNote = teacher.ProfileRejectionNote,
            AccountStatus = MapAccountStatus(teacher.AccountStatus),
            AccountStatusNote = teacher.AccountStatusNote,
            CanShowContact = canShowContact,
            ContactEmail = canShowContact ? user?.Email : null,
            ContactPhone = canShowContact ? user?.PhoneNumber : null,
            PublishedCourseCount = stats?.PublishedCourseCount ?? 0,
            PublishedArticleCount = stats?.PublishedArticleCount ?? 0,
            Points = stats?.Points ?? 0,
            StudentCount = stats?.StudentCount ?? 0,
            ReviewCount = stats?.ReviewCount ?? 0,
            Educations = teacher.TeacherEducations
                .Select(e => new TeacherEducationQri
                {
                    Id = e.Id,
                    UniversityName = e.NameOfInstitutionOrUniversity ?? string.Empty,
                    DegreeType = MapDegreeType(e.TypeOfDegree),
                    DegreeImage = e.DegreeImage ?? string.Empty,
                })
                .ToList(),
            Skills = teacher.ExpertiseAreas
                .Select(s => new TeacherSkillQri
                {
                    Id = s.Id,
                    Name = s.Name ?? string.Empty,
                    Rate = s.Rate,
                })
                .OrderByDescending(s => s.Rate)
                .ToList(),
            Courses = teacher.Courses
                .Where(c => c.IsPublish && c.ModerationStatus == TeacherApprovalStatus.Approved)
                .OrderByDescending(c => c.CreateAt)
                .Select(c => new TeacherCourseSummaryQri
                {
                    CourseId = c.CourseId,
                    Title = c.Title ?? string.Empty,
                    ThumbnailUrl = c.LogoImage,
                    Price = c.Price ?? 0,
                    Level = c.CourseLevel.ToString(),
                })
                .ToList(),
        };
    }

    public async Task<PagedData<SearchTeacherQri>> SearchTeachersAsync(SearchTeachersQuery query)
    {
        var pageNumber = query.PageNumber <= 0 ? 1 : query.PageNumber;
        var pageSize = query.PageSize <= 0 ? 12 : query.PageSize;
        var search = (query.InputValue ?? string.Empty).Trim().ToLowerInvariant();

        var baseQuery = _dbContext.Teachers.AsNoTracking()
            .Include(t => t.User)
            .Include(t => t.TeachingCategory)
            .AsQueryable();

        if (!query.ForAdmin)
            baseQuery = baseQuery.Where(t => t.ProfileApprovalStatus == (byte)TeacherApprovalStatus.Approved);

        if (query.TeachingCategoryId is > 0)
            baseQuery = baseQuery.Where(t => t.TeachingCategoryId == query.TeachingCategoryId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            baseQuery = baseQuery.Where(t =>
                (t.User!.FirstName + " " + t.User.LastName).ToLower().Contains(search) ||
                t.User.UserName!.ToLower().Contains(search) ||
                (t.ShortDescription ?? string.Empty).ToLower().Contains(search) ||
                (t.LongDescription ?? string.Empty).ToLower().Contains(search) ||
                (t.TeachingCategory != null && t.TeachingCategory.Name.ToLower().Contains(search)));
        }

        var totalCount = query.NeedTotalCount ? await baseQuery.CountAsync() : 0;
        var rows = await baseQuery
            .OrderByDescending(t => t.ApprovedAtUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        Dictionary<long, long> walletByUserId = [];
        if (query.ForAdmin && rows.Count > 0)
        {
            var userIds = rows.Select(t => t.UserId).Distinct().ToList();
            walletByUserId = await _dbContext.UserWallets.AsNoTracking()
                .Where(w => !w.IsPlatformWallet && userIds.Contains(w.UserId))
                .ToDictionaryAsync(w => w.UserId, w => w.AvailableBalanceToman);
        }

        var items = new List<SearchTeacherQri>();
        foreach (var teacher in rows)
        {
            var stats = await GetProfileStatsAsync(teacher.Id, teacher.UserId);
            var user = teacher.User;
            var item = new SearchTeacherQri
            {
                TeacherId = teacher.Id,
                UserId = teacher.UserId,
                DisplayName = user != null ? $"{user.FirstName} {user.LastName}".Trim() : string.Empty,
                UserName = user?.UserName ?? string.Empty,
                AvatarUrl = !string.IsNullOrWhiteSpace(user?.ProfileImage)
                    ? user!.ProfileImage!
                    : BuildAvatarPlaceholder(user?.UserName ?? string.Empty),
                HeaderImageUrl = string.IsNullOrWhiteSpace(teacher.HeaderImageUrl)
                    ? DashboardProfileDefaults.HeaderImageUrl
                    : teacher.HeaderImageUrl,
                ShortDescription = teacher.ShortDescription ?? string.Empty,
                TeachingCategoryName = teacher.TeachingCategory?.Name ?? string.Empty,
                TeachingCategorySlug = teacher.TeachingCategory?.Slug ?? string.Empty,
                PublishedCourseCount = stats?.PublishedCourseCount ?? 0,
                PublishedArticleCount = stats?.PublishedArticleCount ?? 0,
                Points = stats?.Points ?? 0,
            };

            if (query.ForAdmin)
            {
                item.Email = user?.Email;
                item.PhoneNumber = FormatPhoneNumber(user?.PhoneCountryCode, user?.PhoneNumber);
                item.AccountStatus = MapAccountStatus(teacher.AccountStatus);
                item.ProfileApprovalStatus = MapApprovalStatus(teacher.ProfileApprovalStatus);
                item.IsUserBlocked = string.Equals(user?.Status, UserStatus.BLOCKED.ToString(), StringComparison.OrdinalIgnoreCase)
                    || user?.Status == "3";
                item.WalletBalanceToman = walletByUserId.GetValueOrDefault(teacher.UserId);
            }

            items.Add(item);
        }

        return new PagedData<SearchTeacherQri>
        {
            QueryResult = items,
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = totalCount,
        };
    }

    private static string? FormatPhoneNumber(string? countryCode, string? localNumber)
    {
        if (string.IsNullOrWhiteSpace(localNumber))
            return null;

        var digits = new string(localNumber.Where(char.IsDigit).ToArray());
        if (digits.StartsWith('0'))
            return digits;
        if (digits.Length == 10 && digits[0] == '9')
            return $"0{digits}";

        return string.IsNullOrWhiteSpace(countryCode) ? localNumber : $"{countryCode}{localNumber}";
    }

    public async Task<List<TeacherTeachingCategoryItemQri>> GetTeachingCategoriesAsync()
    {
        return await _dbContext.TeacherTeachingCategories.AsNoTracking()
            .Where(c => c.IsActive)
            .OrderBy(c => c.SortOrder)
            .Select(c => new TeacherTeachingCategoryItemQri
            {
                Id = c.Id,
                Name = c.Name,
                Slug = c.Slug,
                Description = c.Description,
            })
            .ToListAsync();
    }

    public async Task<List<PendingTeacherProfileQri>> GetPendingProfilesAsync()
    {
        return await _dbContext.Teachers.AsNoTracking()
            .Where(t => t.ProfileApprovalStatus == (byte)TeacherApprovalStatus.Pending)
            .Include(t => t.User)
            .Include(t => t.TeachingCategory)
            .OrderByDescending(t => t.SubmittedAtUtc)
            .Select(t => new PendingTeacherProfileQri
            {
                TeacherId = t.Id,
                UserId = t.UserId,
                DisplayName = (t.User!.FirstName + " " + t.User.LastName).Trim(),
                UserName = t.User.UserName ?? string.Empty,
                TeachingCategoryName = t.TeachingCategory != null ? t.TeachingCategory.Name : string.Empty,
                SubmittedAtUtc = t.SubmittedAtUtc,
                ProfileApprovalStatus = "pending",
            })
            .ToListAsync();
    }

    public async Task<TeacherProfileStatsQri?> GetProfileStatsAsync(long teacherId, long userId)
    {
        if (teacherId <= 0)
            return null;

        var publishedCourseCount = await _dbContext.Courses.AsNoTracking()
            .CountAsync(c => c.TeacherId == teacherId
                && c.IsPublish
                && c.ModerationStatus == TeacherApprovalStatus.Approved);

        var publishedArticleCount = userId > 0
            ? await _dbContext.Articles.AsNoTracking().CountAsync(a =>
                a.AuthorUserId == userId
                && a.IsPublished
                && a.ModerationStatus == (byte)TeacherApprovalStatus.Approved)
            : 0;

        var courseIds = await _dbContext.Courses.AsNoTracking()
            .Where(c => c.TeacherId == teacherId
                && c.IsPublish
                && c.ModerationStatus == TeacherApprovalStatus.Approved)
            .Select(c => c.CourseId)
            .ToListAsync();

        var studentCount = courseIds.Count == 0
            ? 0
            : await _dbContext.Enrollments.AsNoTracking()
                .CountAsync(e => courseIds.Contains(e.CourseId) && e.IsActive);

        var reviewCount = courseIds.Count == 0
            ? 0
            : await _dbContext.Set<Entities.Courses.CourseCommentQueryModel>().AsNoTracking()
                .CountAsync(c => courseIds.Contains(c.CourseId) && c.IsApproved);

        var points = courseIds.Count == 0
            ? 0
            : await _dbContext.Courses.AsNoTracking()
                .Where(c => courseIds.Contains(c.CourseId))
                .Select(c => (int)(c.NumberOfRatings ?? 0))
                .SumAsync();

        return new TeacherProfileStatsQri
        {
            PublishedCourseCount = publishedCourseCount,
            PublishedArticleCount = publishedArticleCount,
            StudentCount = studentCount,
            ReviewCount = reviewCount,
            Points = points,
        };
    }

    private static string MapApprovalStatus(byte status) => status switch
    {
        (byte)TeacherApprovalStatus.Pending => "pending",
        (byte)TeacherApprovalStatus.Approved => "approved",
        (byte)TeacherApprovalStatus.Rejected => "rejected",
        _ => "draft",
    };

    private static string MapAccountStatus(byte status) => status switch
    {
        (byte)TeacherAccountStatus.Blocked => "blocked",
        (byte)TeacherAccountStatus.Terminated => "terminated",
        _ => "active",
    };

    private static string MapDegreeType(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return "bachelors";

        var normalized = raw.Trim().ToUpperInvariant();
        return normalized switch
        {
            "PH_D" or "PHD" or "4" => "phd",
            "MASTER" or "MASTERS" or "3" => "masters",
            "BACHELOR" or "BACHELORS" or "2" => "bachelors",
            "WORK" or "1" => "certificate",
            _ => raw.Trim().ToLowerInvariant(),
        };
    }

    private static string BuildAvatarPlaceholder(string userName)
    {
        var seed = string.IsNullOrWhiteSpace(userName) ? "teacher" : userName.Trim().ToLowerInvariant();
        return $"https://api.dicebear.com/9.x/initials/svg?seed={Uri.EscapeDataString(seed)}";
    }

    public async Task<bool> IsUserFollowingTeacherAsync(long followerUserId, long teacherId) =>
        followerUserId > 0 && teacherId > 0 &&
        await _dbContext.TeacherFollows.AsNoTracking()
            .AnyAsync(f => f.FollowerUserId == followerUserId && f.TeacherId == teacherId);

    public async Task<int> GetTeacherFollowerCountAsync(long teacherId) =>
        teacherId <= 0
            ? 0
            : await _dbContext.TeacherFollows.AsNoTracking().CountAsync(f => f.TeacherId == teacherId);

    public async Task<HashSet<long>> GetFollowedTeacherIdsAsync(long followerUserId, IEnumerable<long> teacherIds)
    {
        if (followerUserId <= 0)
            return [];

        var ids = teacherIds.Where(id => id > 0).Distinct().ToList();
        if (ids.Count == 0)
            return [];

        var followed = await _dbContext.TeacherFollows.AsNoTracking()
            .Where(f => f.FollowerUserId == followerUserId && ids.Contains(f.TeacherId))
            .Select(f => f.TeacherId)
            .ToListAsync();

        return followed.ToHashSet();
    }
}
