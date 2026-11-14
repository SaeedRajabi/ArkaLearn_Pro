using System.Net;
using System.Text.RegularExpressions;
using ArkaLearnDesktop.Application.Abstractions;

namespace ArkaLearnDesktop.App.Services;

internal static class ChatHtmlHelper
{
    private static readonly Regex ImgSrcRegex = new(
        @"<img[^>]+src\s*=\s*[""']([^""']+)[""']",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex AudioSrcRegex = new(
        @"<(?:audio[^>]+src\s*=\s*[""']([^""']+)[""']|source[^>]+src\s*=\s*[""']([^""']+)[""']|[^>]*data-qa-audio-src\s*=\s*[""']([^""']+)[""'])",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex VideoSrcRegex = new(
        @"<(?:video[^>]+src\s*=\s*[""']([^""']+)[""']|source[^>]+src\s*=\s*[""']([^""']+\.(?:mp4|webm|mov|m4v)[^""']*)[""'])",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex AnchorRegex = new(
        @"<a[^>]+href\s*=\s*[""']([^""']+)[""'][^>]*>(.*?)</a>",
        RegexOptions.IgnoreCase | RegexOptions.Compiled | RegexOptions.Singleline);

    private static readonly Regex EscapedAudioRegex = new(
        @"&lt;audio\s+([^&]*?)src\s*=\s*[""']([^""']+)[""']([^&]*?)&gt;",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public static string BuildPlainTextHtml(string text) =>
        $"<p>{WebUtility.HtmlEncode(text.Trim())}</p>";

    public static string BuildMediaHtml(DesktopChatMediaKind kind, string mediaUrl, string? fileName, string? caption)
    {
        var safeUrl = WebUtility.HtmlEncode(mediaUrl.Trim());
        var captionHtml = string.IsNullOrWhiteSpace(caption)
            ? string.Empty
            : $"<p>{WebUtility.HtmlEncode(caption.Trim())}</p>";

        return kind switch
        {
            DesktopChatMediaKind.Image => $"{captionHtml}<img src=\"{safeUrl}\" alt=\"image\" />",
            DesktopChatMediaKind.Audio => $"{captionHtml}<audio controls src=\"{safeUrl}\"></audio>",
            DesktopChatMediaKind.Video => $"{captionHtml}<video controls src=\"{safeUrl}\"></video>",
            _ => $"{captionHtml}<p><a href=\"{safeUrl}\" target=\"_blank\">{WebUtility.HtmlEncode(fileName ?? "فایل پیوست")}</a></p>",
        };
    }

    public static ChatMediaParts Parse(string? contentHtml, string apiBaseUrl)
    {
        var html = NormalizeHtml(contentHtml);
        var richHtml = ChatHtmlFlowHelper.StripMediaTags(html);
        var text = StripHtml(html);
        var image = FirstMatch(ImgSrcRegex, html);
        var audio = FirstAudio(html);
        var video = FirstVideo(html);
        string? fileUrl = null;
        string? fileName = null;

        if (image is null && audio is null && video is null)
        {
            var anchor = AnchorRegex.Match(html);
            if (anchor.Success)
            {
                fileUrl = anchor.Groups[1].Value;
                fileName = StripHtml(anchor.Groups[2].Value);
                if (string.IsNullOrWhiteSpace(fileName))
                    fileName = "فایل پیوست";
            }
        }

        return new ChatMediaParts(
            text,
            richHtml,
            Resolve(image, apiBaseUrl),
            Resolve(audio, apiBaseUrl),
            Resolve(video, apiBaseUrl),
            Resolve(fileUrl, apiBaseUrl),
            fileName);
    }

    private static string NormalizeHtml(string? contentHtml)
    {
        var html = contentHtml ?? string.Empty;
        html = EscapedAudioRegex.Replace(html, m =>
            $"<audio controls src=\"{m.Groups[2].Value}\"></audio>");
        html = html.Replace("&lt;/audio&gt;", "</audio>", StringComparison.OrdinalIgnoreCase);
        return html;
    }

    private static string? FirstAudio(string html)
    {
        var match = AudioSrcRegex.Match(html);
        if (!match.Success) return null;
        for (var i = 1; i < match.Groups.Count; i++)
        {
            if (match.Groups[i].Success && !string.IsNullOrWhiteSpace(match.Groups[i].Value))
                return match.Groups[i].Value;
        }

        return null;
    }

    private static string? FirstVideo(string html)
    {
        var match = VideoSrcRegex.Match(html);
        if (!match.Success) return null;
        for (var i = 1; i < match.Groups.Count; i++)
        {
            if (match.Groups[i].Success && !string.IsNullOrWhiteSpace(match.Groups[i].Value))
                return match.Groups[i].Value;
        }

        return null;
    }

    private static string? FirstMatch(Regex regex, string html)
    {
        var match = regex.Match(html);
        return match.Success ? match.Groups[1].Value : null;
    }

    private static string? Resolve(string? url, string apiBaseUrl) =>
        string.IsNullOrWhiteSpace(url)
            ? null
            : DesktopMediaUriHelper.Resolve(url, apiBaseUrl)?.ToString();

    private static string StripHtml(string html)
    {
        var text = Regex.Replace(html, "<[^>]+>", " ");
        text = WebUtility.HtmlDecode(text);
        return Regex.Replace(text, @"\s+", " ").Trim();
    }
}

internal sealed record ChatMediaParts(
    string Text,
    string RichHtml,
    string? ImageUrl,
    string? AudioUrl,
    string? VideoUrl,
    string? FileUrl,
    string? FileName);
