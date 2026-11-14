using System.Resources;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Microsoft.EntityFrameworkCore;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetUserByToken;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetUserByCookie;
using Framework.Src.Core.RequestResponse.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.SearchUsersByInputValue;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetUserByUserNameOrEmail;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Users;
using Framework.Src.Utilities.OutService.DateTimes;
using Microsoft.EntityFrameworkCore.Storage.Json;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories
{
    public class UserQueryRepository(ArkaSoftwareQueryDbContext dbContext)
        : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext), IUserQueryRepository
    {
        public async Task<UserQr?> ExecuteAsync(GetUserByIdQuery query) =>
            await _dbContext.Users.Select(x => new UserQr()
            {
                UserId = x.Id,
                FullName = x.FirstName + " " + x.LastName,
                FirstName = x.FirstName,
                LastName = x.LastName,
                UserName = x.UserName,
                PhoneNumber = x.PhoneNumber,
                Email = x.Email,
                Avatar = x.ProfileImage ?? "/assets/icons/defaultUserImage.png",
                Status = x.Status.ToString(),
                UserRole = x.Role.ToDisplayName()

            }).FirstOrDefaultAsync(x => x.UserId.Equals(query.UserId));

        public async Task<GetUserByUserNameOrEmailQri?> ExecuteByUserNameOrEmailAsync(GetUserByUserNameOrEmailQuery query)
        {
            var result = await _dbContext.Users.AsNoTracking()
                .Select(x => new GetUserByUserNameOrEmailQri
                {
                    fullName = x.FirstName + " " + x.LastName,
                    UserName = x.UserName ?? "",
                    Email = x.Email ?? "",
                    PhoneNumber = x.PhoneNumber ?? "",
                    UserRole = x.Role.ToDisplayName(),
                    ProfileImage = x.ProfileImage ?? "",
                    Status = x.Status.ToString(),
                    CreateDateTime = x.CreateAt.ToString("HH:mm - yyyy/MM/dd"),
                    TwoFactorEnable = x.TwoFactorEnable
                    
                })
                .SingleOrDefaultAsync(x => x.UserName == query.UserNameOrEmail || x.Email == query.UserNameOrEmail);


            return result!;
        }

        public async Task<UserLookupByIdentity?> GetUserLookupByIdentityAsync(
            string userName,
            string? email,
            CancellationToken cancellationToken = default)
        {
            var normalizedUserName = (userName ?? string.Empty).Trim();
            var normalizedEmail = (email ?? string.Empty).Trim();
            if (string.IsNullOrEmpty(normalizedUserName) && string.IsNullOrEmpty(normalizedEmail))
                return null;

            var normalizedUserNameLower = normalizedUserName.ToLowerInvariant();
            var normalizedEmailLower = normalizedEmail.ToLowerInvariant();

            return await _dbContext.Users.AsNoTracking()
                .Where(u =>
                    (!string.IsNullOrEmpty(normalizedUserName) &&
                     u.UserName != null &&
                     u.UserName.ToLower() == normalizedUserNameLower) ||
                    (!string.IsNullOrEmpty(normalizedEmail) &&
                     u.Email != null &&
                     u.Email.ToLower() == normalizedEmailLower))
                .OrderByDescending(u =>
                    !string.IsNullOrEmpty(normalizedUserName) &&
                    u.UserName != null &&
                    u.UserName.ToLower() == normalizedUserNameLower
                        ? 1
                        : 0)
                .Select(u => new UserLookupByIdentity
                {
                    UserId = u.Id,
                    PhoneNumber = u.PhoneNumber,
                })
                .FirstOrDefaultAsync(cancellationToken);
        }

        public async Task<string?> GetSmsMobileByUserIdAsync(long userId, CancellationToken cancellationToken = default)
        {
            if (userId <= 0)
                return null;

            var user = await _dbContext.Users.AsNoTracking()
                .Where(u => u.Id == userId)
                .Select(u => new
                {
                    u.PhoneNumber,
                    u.PhoneCountryCode,
                    u.UserName,
                    u.Email,
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (user is null)
                return null;

            var candidates = new List<string>();

            void AddCandidate(string? raw)
            {
                if (string.IsNullOrWhiteSpace(raw))
                    return;
                candidates.Add(raw.Trim());
            }

            var localNumber = user.PhoneNumber?.Trim();
            if (!string.IsNullOrWhiteSpace(localNumber))
            {
                AddCandidate(localNumber);
                var countryCode = user.PhoneCountryCode?.Trim();
                if (!string.IsNullOrWhiteSpace(countryCode))
                    AddCandidate($"{countryCode}{localNumber}");
            }

            AddCandidate(user.UserName);
            AddCandidate(user.Email);

            var userNameLower = user.UserName?.Trim().ToLowerInvariant();
            var emailLower = user.Email?.Trim().ToLowerInvariant();

            if (!string.IsNullOrWhiteSpace(userNameLower) || !string.IsNullOrWhiteSpace(emailLower))
            {
                var managedPhones = await _dbContext.ManagedRoomStudents.AsNoTracking()
                    .Where(m => !m.IsDelete &&
                                ((userNameLower != null && m.UserName.ToLower() == userNameLower) ||
                                 (emailLower != null && m.Email != null && m.Email.ToLower() == emailLower)))
                    .Select(m => m.Phone)
                    .ToListAsync(cancellationToken);

                foreach (var managedPhone in managedPhones)
                    AddCandidate(managedPhone);
            }

            foreach (var candidate in candidates)
            {
                if (IranianPhoneNormalizer.TryNormalizeLocalNumber(candidate, out var normalized))
                    return normalized;
            }

            return null;
        }

        public async Task<GetUserByCookieQri?> ExecuteUserByCookieAsync(GetUserByCookieQuery userQuery) => 
             await _dbContext.Users.AsNoTracking().Select(x => new GetUserByCookieQri
                {
                    Id = x.Id.ToString(),
                    UserName = x.UserName,
                    Role = x.Role != null ? x.Role.ToDisplayName() : "user",
                    Email = x.Email ?? "Not Email Address",
                    EmailVerified = x.EmailVerified,
                    PhoneNumber = x.PhoneNumber,
                    PhoneNumberVerified = x.PhoneNumberVerified,
                    TwoFactorEnabled = x.TwoFactorEnable,
                    FullName = $"{x.FirstName ?? "Not Name"} {x.LastName ?? "Not Family"}".Trim(),
                    ProfileImage = x.ProfileImage ?? "/assets/icons/defaultUserImage.png",
                    Status = x.Status

            }).FirstOrDefaultAsync(x => x.UserName!.Equals(userQuery.userName));
        

        public async Task<UserByTokenQri?> ExecuteUserByTokenAsync(string UserName)
        {
            return await _dbContext.Users.Where(x => x.UserName == UserName)
                .AsNoTracking()
                .Select(x => new UserByTokenQri
                {
                    Id = x.Id.ToString(),
                    UserName = x.UserName,
                    Role = x.Role != null ? x.Role.ToDisplayName() : "user",
                    Email = x.Email,
                    EmailVerified = x.EmailVerified,
                    FullName = $"{x.FirstName} {x.LastName}",
                    ProfileImage = x.ProfileImage
                })
                .SingleOrDefaultAsync();
        }

        public async Task<UserEmailVerificationInfo?> GetEmailVerificationInfoAsync(
            long userId,
            CancellationToken cancellationToken = default)
        {
            return await _dbContext.Users.AsNoTracking()
                .Where(x => x.Id == userId)
                .Select(x => new UserEmailVerificationInfo
                {
                    EmailVerified = x.EmailVerified,
                    Role = x.Role,
                    Email = x.Email ?? string.Empty,
                    FullName = $"{x.FirstName ?? string.Empty} {x.LastName ?? string.Empty}".Trim()
                })
                .FirstOrDefaultAsync(cancellationToken);
        }

        public async Task<PagedData<SearchUsersByInputValueQri>?> SearchUsersExecuteAsync(SearchUsersByInputValueQuery query)
        {
            PagedData<SearchUsersByInputValueQri?> result = new();
            
            var input = query.InputValue ?? string.Empty;
            var queryResult = _dbContext.Users
                .AsNoTracking()
                .Where(x =>
                    (x.UserName != null && x.UserName.ToLower().Contains(input.ToLower())) ||
                    (x.Email != null && x.Email!.ToLower().Contains(input.ToLower())) ||
                    (x.FirstName != null && x.FirstName.ToLower().Contains(input.ToLower())) ||
                    (x.LastName != null && x.LastName.ToLower().Contains(input.ToLower())) ||
                    (x.PhoneNumber != null && x.PhoneNumber.Contains(input)))
                .OrderBy(x => x.UserName);
            if (query.NeedTotalCount)
            {
                result.TotalCount = await queryResult.CountAsync();
            }

            var users = await queryResult
                .Skip(query.SkipCount)
                .Take(query.PageSize)
                .Select(x => new SearchUsersByInputValueQri
                {
                    Id = x.Id,
                    Name = x.FirstName + " " + x.LastName,
                    Email = x.Email ?? "",
                    AvatarUrl = x.ProfileImage ?? "/assets/icons/defaultUserImage.png",
                    Initials = !string.IsNullOrEmpty(x.UserName) && x.UserName.Length >= 2
                        ? x.UserName.Substring(0, 2)
                        : "NO",

                    Role = x.Role.ToDisplayName(),
                    RegistrationDate = x.CreateAt.ToLongPersianDateTimeString(),
                    LastLogin = DateTime.UtcNow.ToLongPersianDateTimeString(),
                    Status = x.Status.ToString(),
                }).ToListAsync();


            result.QueryResult = users!;
            return result!;
        }

        public async Task<UserByPhoneLookup?> GetUserByLocalPhoneAsync(string localPhone, CancellationToken cancellationToken = default)
        {
            var normalized = (localPhone ?? string.Empty).Trim();
            if (normalized.Length < 10)
                return null;

            return await _dbContext.Users.AsNoTracking()
                .Where(x => x.PhoneNumber == normalized)
                .Select(x => new UserByPhoneLookup
                {
                    UserId = x.Id,
                    FullName = ((x.FirstName ?? string.Empty) + " " + (x.LastName ?? string.Empty)).Trim(),
                    Email = x.Email ?? string.Empty,
                })
                .FirstOrDefaultAsync(cancellationToken);
        }
    }

    public static class UserRoleMapper
    {
        public static string ToDisplayName(this UserRole? level)
        {
            return level switch
            {
                UserRole.ADMIN => "admin",
                UserRole.TEACHER => "teacher",
                UserRole.STUDENT => "student",
                _ => "user"
            };
        }
    }
}
