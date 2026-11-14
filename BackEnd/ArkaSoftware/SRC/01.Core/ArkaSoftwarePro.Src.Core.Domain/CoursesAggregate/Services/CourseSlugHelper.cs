using System.Text;
using System.Text.RegularExpressions;

namespace ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Services;

public static class CourseSlugHelper
{
    private static readonly Regex MultiHyphen = new("-{2,}", RegexOptions.Compiled);

    public static string FromTitle(string? title, long? courseId = null)
    {
        if (string.IsNullOrWhiteSpace(title))
            return courseId is > 0 ? $"course-{courseId}" : "course";

        var builder = new StringBuilder(title.Trim().Length);
        foreach (var ch in title.Trim())
        {
            if (char.IsLetterOrDigit(ch))
                builder.Append(char.ToLowerInvariant(ch));
            else if (char.IsWhiteSpace(ch) || ch is '-' or '_')
                builder.Append('-');
        }

        var slug = MultiHyphen.Replace(builder.ToString().Trim('-'), "-");
        if (string.IsNullOrWhiteSpace(slug))
            slug = courseId is > 0 ? $"course-{courseId}" : "course";
        if (slug.Length > 220)
            slug = slug[..220].TrimEnd('-');

        return slug;
    }
}
