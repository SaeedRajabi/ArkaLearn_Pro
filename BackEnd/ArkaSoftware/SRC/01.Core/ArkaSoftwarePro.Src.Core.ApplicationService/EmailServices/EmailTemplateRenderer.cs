using System.Net;
using System.Text.RegularExpressions;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices;

public static partial class EmailTemplateRenderer
{
    [GeneratedRegex(@"\{\{(\w+)\}\}", RegexOptions.Compiled)]
    private static partial Regex PlaceholderRegex();

    public static string Render(string template, IReadOnlyDictionary<string, string?> variables)
    {
        if (string.IsNullOrEmpty(template))
            return string.Empty;

        return PlaceholderRegex().Replace(template, match =>
        {
            var key = match.Groups[1].Value;
            if (!variables.TryGetValue(key, out var value) || value is null)
                return string.Empty;
            return WebUtility.HtmlEncode(value);
        });
    }

    public static (string Subject, string BodyHtml) RenderTemplate(
        string subjectTemplate,
        string bodyTemplate,
        IReadOnlyDictionary<string, string?> variables)
        => (Render(subjectTemplate, variables), Render(bodyTemplate, variables));
}
