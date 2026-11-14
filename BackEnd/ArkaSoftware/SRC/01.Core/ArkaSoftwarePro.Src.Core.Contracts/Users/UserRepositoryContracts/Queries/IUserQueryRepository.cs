using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetUserByCookie;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetUserByToken;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetUserByUserNameOrEmail;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.SearchUsersByInputValue;
using Framework.Src.Core.Contracts.Data.Queries;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries
{
    public interface IUserQueryRepository : IQueryRepository
    {
        public Task<UserQr?> ExecuteAsync(GetUserByIdQuery query);
        public Task<GetUserByUserNameOrEmailQri?> ExecuteByUserNameOrEmailAsync(GetUserByUserNameOrEmailQuery query);
        public Task<UserByTokenQri?> ExecuteUserByTokenAsync(string UserName);
        public Task<GetUserByCookieQri?> ExecuteUserByCookieAsync(GetUserByCookieQuery userQuery);
        Task<PagedData<SearchUsersByInputValueQri>?> SearchUsersExecuteAsync(SearchUsersByInputValueQuery query);
        Task<UserLookupByIdentity?> GetUserLookupByIdentityAsync(
            string userName,
            string? email,
            CancellationToken cancellationToken = default);

        /// <summary>Resolves a normalized Iranian mobile (10 digits, leading 9) for SMS delivery.</summary>
        Task<string?> GetSmsMobileByUserIdAsync(long userId, CancellationToken cancellationToken = default);

        Task<UserEmailVerificationInfo?> GetEmailVerificationInfoAsync(
            long userId,
            CancellationToken cancellationToken = default);

        Task<UserByPhoneLookup?> GetUserByLocalPhoneAsync(string localPhone, CancellationToken cancellationToken = default);
    }

    public sealed class UserByPhoneLookup
    {
        public long UserId { get; init; }
        public string FullName { get; init; } = string.Empty;
        public string Email { get; init; } = string.Empty;
    }

    public sealed class UserEmailVerificationInfo
    {
        public bool EmailVerified { get; init; }
        public UserRole? Role { get; init; }
        public string Email { get; init; } = string.Empty;
        public string FullName { get; init; } = string.Empty;
    }

    public sealed class UserLookupByIdentity
    {
        public long UserId { get; init; }
        public string? PhoneNumber { get; init; }
    }
}
