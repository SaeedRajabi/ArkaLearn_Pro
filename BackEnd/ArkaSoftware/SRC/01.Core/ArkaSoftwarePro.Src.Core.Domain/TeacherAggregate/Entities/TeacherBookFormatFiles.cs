namespace ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;

public sealed class TeacherBookFormatFiles
{
    public string? PdfFileUrl { get; init; }
    public string? PdfFileName { get; init; }
    public string? EpubFileUrl { get; init; }
    public string? EpubFileName { get; init; }
    public string? WordFileUrl { get; init; }
    public string? WordFileName { get; init; }

    public bool HasAnyFile =>
        !string.IsNullOrWhiteSpace(PdfFileUrl)
        || !string.IsNullOrWhiteSpace(EpubFileUrl)
        || !string.IsNullOrWhiteSpace(WordFileUrl);

    public static TeacherBookFormatFiles FromLegacy(string? bookFileUrl, string? bookFileName)
    {
        if (string.IsNullOrWhiteSpace(bookFileUrl))
            return new TeacherBookFormatFiles();

        var name = bookFileName ?? string.Empty;
        var url = bookFileUrl.Trim();
        var lowerName = name.ToLowerInvariant();
        var lowerUrl = url.ToLowerInvariant();

        if (lowerName.EndsWith(".pdf") || lowerUrl.EndsWith(".pdf"))
        {
            return new TeacherBookFormatFiles { PdfFileUrl = url, PdfFileName = string.IsNullOrWhiteSpace(name) ? null : name.Trim() };
        }

        if (lowerName.EndsWith(".epub") || lowerUrl.EndsWith(".epub"))
        {
            return new TeacherBookFormatFiles { EpubFileUrl = url, EpubFileName = string.IsNullOrWhiteSpace(name) ? null : name.Trim() };
        }

        if (lowerName.EndsWith(".doc") || lowerName.EndsWith(".docx")
            || lowerUrl.EndsWith(".doc") || lowerUrl.EndsWith(".docx"))
        {
            return new TeacherBookFormatFiles { WordFileUrl = url, WordFileName = string.IsNullOrWhiteSpace(name) ? null : name.Trim() };
        }

        return new TeacherBookFormatFiles { PdfFileUrl = url, PdfFileName = string.IsNullOrWhiteSpace(name) ? null : name.Trim() };
    }
}
