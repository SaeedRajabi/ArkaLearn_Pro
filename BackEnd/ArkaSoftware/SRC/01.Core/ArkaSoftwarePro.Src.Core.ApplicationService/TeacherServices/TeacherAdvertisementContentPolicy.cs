using System.Text.RegularExpressions;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;

public static class TeacherAdvertisementContentPolicy
{
    private static readonly Regex HtmlTagRegex = new("<[^>]+>", RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex WhitespaceRegex = new(@"\s+", RegexOptions.Compiled);

    private static readonly Regex[] TechTermPatterns =
    [
        new(@"\bASP\.NET(?:\s+Core)?\b", RegexOptions.Compiled | RegexOptions.IgnoreCase),
        new(@"\.NET(?:\s+Framework)?\b", RegexOptions.Compiled | RegexOptions.IgnoreCase),
        new(@"\bNext\.js\b", RegexOptions.Compiled | RegexOptions.IgnoreCase),
        new(@"\bNode\.js\b", RegexOptions.Compiled | RegexOptions.IgnoreCase),
        new(@"\bVue\.js\b", RegexOptions.Compiled | RegexOptions.IgnoreCase),
        new(@"\bReact\.js\b", RegexOptions.Compiled | RegexOptions.IgnoreCase),
        new(@"\bThree\.js\b", RegexOptions.Compiled | RegexOptions.IgnoreCase),
        new(@"\bExpress\.js\b", RegexOptions.Compiled | RegexOptions.IgnoreCase),
        new(@"\bD3\.js\b", RegexOptions.Compiled | RegexOptions.IgnoreCase),
        new(@"\bChart\.js\b", RegexOptions.Compiled | RegexOptions.IgnoreCase),
        new(@"\bNuxt\.js\b", RegexOptions.Compiled | RegexOptions.IgnoreCase),
        new(@"\bNest\.js\b", RegexOptions.Compiled | RegexOptions.IgnoreCase),
        new(@"\bBackbone\.js\b", RegexOptions.Compiled | RegexOptions.IgnoreCase),
        new(@"\bSocket\.IO\b", RegexOptions.Compiled | RegexOptions.IgnoreCase),
        new(@"\bCI/CD\b", RegexOptions.Compiled | RegexOptions.IgnoreCase),
    ];

    private static readonly Regex PhoneRegex = new(
        @"(?<!\d)(?:\+?\d{1,3}[\s\-().]*)?(?:0?9\d{2}[\s\-().]*\d{3}[\s\-().]*\d{4}|0\d{2,3}[\s\-().]*\d{3,4}[\s\-().]*\d{3,4})(?!\d)|(?<!\d)\d{7,15}(?!\d)",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly Regex ExplicitUrlRegex = new(
        @"https?://[^\s<>""']+|www\.[^\s<>""']+",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly Regex BareDomainRegex = new(
        @"\b[a-z0-9][a-z0-9-]{3,62}[a-z0-9]\.(?:com|ir|net|org|io|dev|app|me|co|info|biz|site|online|shop|store|blog|link|xyz|tech|edu|ac\.ir|co\.ir|org\.ir|gov\.ir)(?:/[^\s<>""']*)?\b",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly Regex EmailRegex = new(
        @"[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly Regex SocialRegex = new(
        @"(?:https?://(?:t\.me|telegram\.|wa\.me|whatsapp\.|instagram\.|linkedin\.|github\.|gitlab\.|bale\.|rubika\.|eitaa\.|aparat\.|youtube\.|youtu\.be|twitter\.|x\.com|facebook\.)[^\s<>""']+|(?:^|\s)(?:t\.me/|telegram\.me/|wa\.me/|instagram\.com/|linkedin\.com/|github\.com/)[^\s<>""']+)",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly Regex PersianContactHintRegex = new(
        @"(سایت\s*(?:شخصی|خودم|ما|من)|وب\s*سایت|وبسایت|شماره\s*تماس|تماس\s*بگیرید|واتس\s*اپ|واتساپ|اینستا(?:گرام)?|لینکدین\s*من|گیت\s*ه(?:اب)?\s*من|پیام\s*دهید|پیام\s*بدهید|دایرکت\s*بدهید|کانال\s*تلگرام|گروه\s*تلگرام|شماره\s*موبایل|موبایل\s*من|تماس\s*مستقیم|برند\s*شخصی)",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    public static string StripHtml(string? html)
    {
        if (string.IsNullOrWhiteSpace(html)) return string.Empty;
        var decoded = System.Net.WebUtility.HtmlDecode(html);
        var withoutTags = HtmlTagRegex.Replace(decoded, " ");
        return WhitespaceRegex.Replace(withoutTags, " ").Trim();
    }

    public static string? EvaluateTextFields(string title, string workExperience, string descriptionHtml, IReadOnlyList<string> tags)
    {
        var fields = new (string Label, string Text)[]
        {
            ("title", title ?? string.Empty),
            ("workExperience", workExperience ?? string.Empty),
            ("description", StripHtml(descriptionHtml)),
            ("tags", string.Join(", ", tags ?? Array.Empty<string>())),
        };

        foreach (var (_, text) in fields)
        {
            if (string.IsNullOrWhiteSpace(text)) continue;

            if (PhoneRegex.IsMatch(text))
                return "در متن آگهی نباید شماره تماس، موبایل یا راه ارتباطی مستقیم وارد شود. فقط مهارت‌ها و سوابق تدریس خود را بنویسید.";

            if (EmailRegex.IsMatch(text))
                return "در متن آگهی نباید آدرس ایمیل یا راه ارتباطی مستقیم وارد شود.";

            if (ContainsLikelyUrl(text))
                return "در متن آگهی نباید لینک وب‌سایت، برند شخصی یا آدرس اینترنتی خارج از پلتفرم وارد شود.";

            if (SocialRegex.IsMatch(text))
                return "در متن آگهی نباید لینک یا نام شبکه‌های اجتماعی و پیام‌رسان وارد شود.";

            if (PersianContactHintRegex.IsMatch(text))
                return "آگهی فقط باید معرفی مهارت‌ها و سوابق تدریس شما باشد، نه تبلیغ سایت، برند یا راه‌های تماس خارج از پلتفرم.";
        }

        return null;
    }

    private static string NeutralizeTechTerms(string text)
    {
        var result = text;
        foreach (var pattern in TechTermPatterns)
            result = pattern.Replace(result, " ");
        return result;
    }

    private static bool ContainsLikelyUrl(string text)
    {
        var normalized = NeutralizeTechTerms(text);
        return ExplicitUrlRegex.IsMatch(normalized) || BareDomainRegex.IsMatch(normalized);
    }
}
