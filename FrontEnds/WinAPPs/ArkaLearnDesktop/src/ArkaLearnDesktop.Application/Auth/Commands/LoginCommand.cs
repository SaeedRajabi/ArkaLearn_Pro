using ArkaLearnDesktop.Application.Abstractions;
using MediatR;

namespace ArkaLearnDesktop.Application.Auth.Commands;

public sealed record LoginCommand(string UserNameOrEmail, string Password, string AppVersion) : IRequest<LoginResult>;

public sealed record LoginResult(bool Success, string? ErrorMessage, DesktopUserProfile? User);

public sealed class LoginCommandHandler(IDesktopApiClient apiClient, IAuthSessionStore sessionStore)
    : IRequestHandler<LoginCommand, LoginResult>
{
    public async Task<LoginResult> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.UserNameOrEmail) || string.IsNullOrWhiteSpace(request.Password))
            return new LoginResult(false, "نام کاربری و رمز عبور الزامی است.", null);

        try
        {
            var result = await apiClient.LoginAsync(request.UserNameOrEmail.Trim(), request.Password, cancellationToken);
            if (!result.Success || result.User is null || string.IsNullOrWhiteSpace(result.AccessToken))
                return new LoginResult(false, result.ErrorMessage ?? "ورود ناموفق بود.", null);

            await sessionStore.SaveAsync(result.User, result.AccessToken, result.ExpiresAtUtc, cancellationToken);

            var access = await apiClient.RegisterDesktopDeviceAsync(request.AppVersion, cancellationToken);
            if (!access.IsAllowed)
            {
                await sessionStore.ClearAsync(cancellationToken);
                return new LoginResult(false, access.BlockReason ?? "دسترسی شما به اپلیکیشن دسکتاپ مسدود شده است.", null);
            }

            return new LoginResult(true, null, result.User);
        }
        catch (Exception ex)
        {
            // Don't expose technical network messages to the end-user.
            if (ex is System.Net.Http.HttpRequestException hre)
            {
                var hostHint = "api.arkasoftware.ir";
                var isHostResolution = hre.Message.Contains(hostHint, System.StringComparison.OrdinalIgnoreCase) ||
                                       hre.InnerException?.Message?.Contains(hostHint, System.StringComparison.OrdinalIgnoreCase) == true;

                var message = isHostResolution
                    ? "امکان اتصال به سرور فراهم نشد (DNS/دسترسی به `api.arkasoftware.ir` ممکن نیست). لطفاً اینترنت و تنظیمات شبکه (یا فیلترشکن/VPN در صورت نیاز) را بررسی کنید و دوباره امتحان کنید."
                    : "خطای اتصال به سرور رخ داد. لطفاً اینترنت را بررسی کنید و دوباره تلاش کنید.";

                return new LoginResult(false, message, null);
            }

            return new LoginResult(false, "خطای غیرمنتظره در ورود رخ داد. لطفاً دوباره تلاش کنید.", null);
        }
    }
}
