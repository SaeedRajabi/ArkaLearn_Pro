using System.Net;
using System.Net.Sockets;
using System.Text.RegularExpressions;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UserActivityServices;

public static class UserActivityIpHelper
{
    public static (string? Ipv4, string? Ipv6) ResolveClientIp(Microsoft.AspNetCore.Http.HttpContext? httpContext)
    {
        if (httpContext == null)
            return (null, null);

        var forwarded = httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        IPAddress? ip = null;

        if (!string.IsNullOrWhiteSpace(forwarded))
        {
            var first = forwarded.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(first) && IPAddress.TryParse(first, out var parsedForwarded))
                ip = parsedForwarded;
        }

        ip ??= httpContext.Connection.RemoteIpAddress;

        if (ip == null)
            return (null, null);

        if (ip.IsIPv4MappedToIPv6)
            ip = ip.MapToIPv4();

        if (ip.AddressFamily == AddressFamily.InterNetwork)
            return (ip.ToString(), null);

        if (ip.AddressFamily == AddressFamily.InterNetworkV6)
            return (null, ip.ToString());

        return (ip.ToString(), null);
    }
}

public static class UserActivityUserAgentHelper
{
    public static (string BrowserName, string BrowserVersion, string OperatingSystem, string DeviceType) Parse(string? userAgent)
    {
        if (string.IsNullOrWhiteSpace(userAgent))
            return ("Unknown", string.Empty, "Unknown", "Desktop");

        var ua = userAgent;

        var os = "Unknown";
        if (ua.Contains("Windows NT 10", StringComparison.OrdinalIgnoreCase)) os = "Windows 10/11";
        else if (ua.Contains("Windows", StringComparison.OrdinalIgnoreCase)) os = "Windows";
        else if (ua.Contains("Mac OS X", StringComparison.OrdinalIgnoreCase)) os = "macOS";
        else if (ua.Contains("Android", StringComparison.OrdinalIgnoreCase)) os = "Android";
        else if (ua.Contains("iPhone", StringComparison.OrdinalIgnoreCase) || ua.Contains("iPad", StringComparison.OrdinalIgnoreCase)) os = "iOS";
        else if (ua.Contains("Linux", StringComparison.OrdinalIgnoreCase)) os = "Linux";

        var deviceType = ua.Contains("Mobile", StringComparison.OrdinalIgnoreCase) || ua.Contains("Android", StringComparison.OrdinalIgnoreCase)
            ? "Mobile"
            : ua.Contains("Tablet", StringComparison.OrdinalIgnoreCase) || ua.Contains("iPad", StringComparison.OrdinalIgnoreCase)
                ? "Tablet"
                : "Desktop";

        string browserName = "Unknown";
        string browserVersion = string.Empty;

        var edge = Regex.Match(ua, @"Edg/([\d\.]+)");
        if (edge.Success)
        {
            browserName = "Edge";
            browserVersion = edge.Groups[1].Value;
        }
        else
        {
            var chrome = Regex.Match(ua, @"Chrome/([\d\.]+)");
            if (chrome.Success && !ua.Contains("Edg", StringComparison.OrdinalIgnoreCase))
            {
                browserName = "Chrome";
                browserVersion = chrome.Groups[1].Value;
            }
            else
            {
                var firefox = Regex.Match(ua, @"Firefox/([\d\.]+)");
                if (firefox.Success)
                {
                    browserName = "Firefox";
                    browserVersion = firefox.Groups[1].Value;
                }
                else
                {
                    var safari = Regex.Match(ua, @"Version/([\d\.]+).*Safari");
                    if (safari.Success)
                    {
                        browserName = "Safari";
                        browserVersion = safari.Groups[1].Value;
                    }
                }
            }
        }

        return (browserName, browserVersion, os, deviceType);
    }
}

public static class UserActivitySubjectKeyHelper
{
    public static string Build(long? userId, string visitorKey)
    {
        if (userId is > 0)
            return $"user-{userId.Value}";
        var key = string.IsNullOrWhiteSpace(visitorKey) ? Guid.NewGuid().ToString("N") : visitorKey.Trim();
        return $"anon-{key}";
    }
}
