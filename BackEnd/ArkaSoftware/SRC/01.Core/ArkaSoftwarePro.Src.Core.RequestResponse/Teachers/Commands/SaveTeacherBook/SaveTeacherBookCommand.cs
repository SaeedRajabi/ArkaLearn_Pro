using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.SaveTeacherBook;

[InvalidatesCache(CacheRegion.Books)]
public class SaveTeacherBookCommand : ICommand<long>, IWebRequest
{
    public long BookId { get; set; }
    public long? TeacherUserId { get; set; }
    /// <summary>Optional teacher aggregate id — helps admin edit from the global books list.</summary>
    public long? TeacherId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
    public string LongDescriptionHtml { get; set; } = string.Empty;
    public string? CoverImageUrl { get; set; }
    public string? BookFileUrl { get; set; }
    public string? BookFileName { get; set; }
    public string? PdfFileUrl { get; set; }
    public string? PdfFileName { get; set; }
    public string? EpubFileUrl { get; set; }
    public string? EpubFileName { get; set; }
    public string? WordFileUrl { get; set; }
    public string? WordFileName { get; set; }
    public string? Publisher { get; set; }
    public int? PublicationYear { get; set; }
    public string? Isbn { get; set; }
    public List<string> Tags { get; set; } = [];
    public int SortOrder { get; set; }
    public long? CategoryId { get; set; }
    public string Path => "/api/Service/Teacher/SaveTeacherBook";
    public string? SeoTitle { get; set; }
    public string? MetaDescription { get; set; }
    public string? OgImageUrl { get; set; }
}
