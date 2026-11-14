using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.UserActivity;
using ArkaSoftwarePro.Src.Core.RequestResponse.UserActivity.Commands.TrackUserActivity;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UserActivityServices.Commands;

public class TrackUserActivityCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IUserActivityBuffer activityBuffer,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<TrackUserActivityCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(TrackUserActivityCommand command)
    {
        var httpContext = httpContextAccessor.HttpContext;
        var user = httpContext?.User;
        long? userId = null;
        string displayName = "کاربر ناشناس";

        if (user?.Identity?.IsAuthenticated == true)
        {
            var claim = user.FindFirst("userId")?.Value
                ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (long.TryParse(claim, out var parsedUserId) && parsedUserId > 0)
                userId = parsedUserId;

            var given = user.FindFirst(ClaimTypes.GivenName)?.Value?.Trim();
            var surname = user.FindFirst(ClaimTypes.Surname)?.Value?.Trim();
            var fullName = $"{given} {surname}".Trim();
            if (!string.IsNullOrWhiteSpace(fullName))
                displayName = fullName;
            else
            {
                var name = user.FindFirst(ClaimTypes.Name)?.Value?.Trim();
                if (!string.IsNullOrWhiteSpace(name))
                    displayName = name;
            }
        }

        var visitorKey = string.IsNullOrWhiteSpace(command.VisitorKey)
            ? Guid.NewGuid().ToString("N")
            : command.VisitorKey.Trim();

        var (ipv4, ipv6) = UserActivityIpHelper.ResolveClientIp(httpContext);
        var userAgent = httpContext?.Request.Headers["User-Agent"].ToString();
        var (browserName, browserVersion, operatingSystem, deviceType) =
            UserActivityUserAgentHelper.Parse(userAgent);

        var subjectKey = UserActivitySubjectKeyHelper.Build(userId, visitorKey);
        var actionTitle = string.IsNullOrWhiteSpace(command.ActionTitle)
            ? $"بازدید از {command.PagePath}"
            : command.ActionTitle.Trim();

        activityBuffer.Add(new UserActivityBufferEvent
        {
            UserId = userId,
            VisitorKey = visitorKey,
            SubjectKey = subjectKey,
            ActionType = command.ActionType,
            ActionTitle = actionTitle,
            PagePath = command.PagePath,
            PageTitle = command.PageTitle,
            Referrer = command.Referrer,
            SiteSource = command.SiteSource,
            IpAddressV4 = ipv4,
            IpAddressV6 = ipv6,
            UserAgent = userAgent,
            BrowserName = browserName,
            BrowserVersion = browserVersion,
            OperatingSystem = operatingSystem,
            DeviceType = deviceType,
            DisplayName = displayName,
            OccurredAtUtc = DateTime.UtcNow,
            MetadataJson = command.MetadataJson,
        });

        return await OkAsync("ok");
    }
}
