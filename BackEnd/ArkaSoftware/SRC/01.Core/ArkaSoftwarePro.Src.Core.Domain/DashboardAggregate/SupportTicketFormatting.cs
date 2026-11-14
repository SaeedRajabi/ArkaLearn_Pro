namespace ArkaSoftwarePro.Src.Core.Domain.DashboardAggregate;

public static class SupportTicketFormatting
{
    public static string FormatDisplayCode(int displayNumber) =>
        $"ARKS-{displayNumber:D6}";

    public static string StripHtml(string? html, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(html))
            return string.Empty;

        var text = System.Text.RegularExpressions.Regex.Replace(html, "<[^>]+>", " ");
        text = System.Net.WebUtility.HtmlDecode(text);
        text = string.Join(' ', text.Split(' ', StringSplitOptions.RemoveEmptyEntries)).Trim();
        if (text.Length <= maxLength)
            return text;
        return text[..maxLength] + "...";
    }
}
