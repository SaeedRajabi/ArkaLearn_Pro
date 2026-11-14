using System.Security.Cryptography;
using System.Text.Json;
using ArkaSoftwarePro.Src.Core.Contracts.Sms;
using ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityCookieContracts;
using ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityTokenContracts;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Enumerations;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Authentication;

public sealed class DesktopWebHandoffService(
    IOtpSessionStore sessionStore,
    IUserCommandRepository userCommandRepository,
    IJwtGenerator jwtGenerator,
    ICookieManager cookieManager)
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private const int TtlMinutes = 3;

    public async Task<(string Code, DateTime ExpiresAtUtc)?> CreateAsync(
        long userId,
        string? returnUrl,
        CancellationToken cancellationToken = default)
    {
        if (userId <= 0)
            return null;

        var user = await userCommandRepository.GetGraphAsync(userId);
        if (user is null || user.IsBlocked())
            return null;

        var code = Convert.ToHexString(RandomNumberGenerator.GetBytes(24)).ToLowerInvariant();
        var expiresAtUtc = DateTime.UtcNow.AddMinutes(TtlMinutes);
        var payload = new HandoffSession
        {
            UserId = userId,
            ReturnUrl = SanitizeReturnUrl(returnUrl),
            ExpiresAtUtc = expiresAtUtc,
        };

        await sessionStore.SetAsync(
            BuildKey(code),
            JsonSerializer.Serialize(payload, JsonOptions),
            TimeSpan.FromMinutes(TtlMinutes),
            cancellationToken);

        return (code, expiresAtUtc);
    }

    public async Task<object?> ConsumeAsync(string? code, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(code))
            return null;

        var key = BuildKey(code.Trim());
        var raw = await sessionStore.GetAsync(key, cancellationToken);
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        await sessionStore.RemoveAsync(key, cancellationToken);

        HandoffSession? session;
        try
        {
            session = JsonSerializer.Deserialize<HandoffSession>(raw, JsonOptions);
        }
        catch
        {
            return null;
        }

        if (session is null || session.UserId <= 0 || session.ExpiresAtUtc <= DateTime.UtcNow)
            return null;

        var user = await userCommandRepository.GetGraphAsync(session.UserId);
        if (user is null || user.IsBlocked())
            return null;

        var accessToken = jwtGenerator.GenerateJwtToken(user);
        await cookieManager.SetAuthCookieAsync(user, accessToken);

        return new
        {
            returnUrl = session.ReturnUrl ?? "/account?view=support-freeze",
            userData = new
            {
                Token = accessToken,
                Id = user.Id.ToString(),
                Name = user.UserFullName != null
                    ? $"{user.UserFullName.FirstName} {user.UserFullName.LastName}".Trim()
                    : user.UserName.ToString(),
                FullName = user.UserFullName != null
                    ? $"{user.UserFullName.FirstName} {user.UserFullName.LastName}".Trim()
                    : user.UserName.Value,
                UserName = user.UserName.Value,
                Email = user.Email.Value,
                EmailVerified = user.EmailVerified,
                TeacherId = user.Teacher != null ? user.Teacher.Id : (long?)null,
                AvatarUrl = user.ProfileImage?.ImageURL
                    ?? (user.UserName.Value.Length >= 2
                        ? user.UserName.Value[..2]
                        : user.UserName.Value),
                Role = user.Role switch
                {
                    UserRole.STUDENT => "student",
                    UserRole.TEACHER => "teacher",
                    UserRole.ADMIN => "admin",
                    _ => "user",
                },
                Status = user.Status.ToString(),
                LastLogin = user.LastLoginDateTime,
            },
        };
    }

    private static string BuildKey(string code) => $"web-handoff:{code}";

    private static string? SanitizeReturnUrl(string? returnUrl)
    {
        if (string.IsNullOrWhiteSpace(returnUrl))
            return "/account?view=support-freeze";

        var trimmed = returnUrl.Trim();
        if (!trimmed.StartsWith('/') || trimmed.StartsWith("//", StringComparison.Ordinal))
            return "/account?view=support-freeze";

        return trimmed;
    }

    private sealed class HandoffSession
    {
        public long UserId { get; set; }
        public string? ReturnUrl { get; set; }
        public DateTime ExpiresAtUtc { get; set; }
    }
}
