using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices;
using ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityCookieContracts;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetUserByCookie;

namespace ArkaSoftwarePro.Src.Endpoints.API.Middleware;

/// <summary>
/// Rejects authenticated requests from blocked accounts and clears auth cookies.
/// </summary>
public sealed class BlockedAccountMiddleware(
    RequestDelegate next,
    ILogger<BlockedAccountMiddleware> logger)
{
    public async Task InvokeAsync(
        HttpContext context,
        IUserQueryRepository userQueryRepository,
        ICookieManager cookieManager)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var userName = context.User.FindFirst(ClaimTypes.Name)?.Value
                ?? context.User.FindFirst("name")?.Value;

            if (!string.IsNullOrWhiteSpace(userName))
            {
                try
                {
                    var profile = await userQueryRepository.ExecuteUserByCookieAsync(
                        new GetUserByCookieQuery { userName = userName });

                    if (profile != null && UserAccountMessages.IsBlockedStatus(profile.Status))
                    {
                        logger.LogInformation("Blocked account access denied for user {UserName}", userName);
                        await cookieManager.LogoutAsync();
                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        context.Response.ContentType = "application/json";
                        await context.Response.WriteAsJsonAsync(new { message = UserAccountMessages.Blocked });
                        return;
                    }
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Blocked-account check failed for user {UserName}", userName);
                }
            }
        }

        await next(context);
    }
}

public static class BlockedAccountMiddlewareExtensions
{
    public static IApplicationBuilder UseBlockedAccountGuard(this IApplicationBuilder app)
        => app.UseMiddleware<BlockedAccountMiddleware>();
}
