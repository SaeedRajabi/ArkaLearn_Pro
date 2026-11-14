using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherBooks;

[CacheableQuery(CacheRegion.Books)]
public class GetTeacherBooksQuery : IQuery<List<TeacherBookPublicQri>>, IWebRequest
{
    public long? UserId { get; set; }
    public long? TeacherId { get; set; }
    public string? UserName { get; set; }
    public bool ForEdit { get; set; }
    public string Path => "/api/Service/Teacher/GetTeacherBooks";
}

public class TeacherBookPublicQri
{
    public long Id { get; set; }
    public long TeacherId { get; set; }
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
    public string Slug { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = [];
    public string ApprovalStatus { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public long? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public List<string> CategoryPath { get; set; } = [];
    public long? TeacherUserId { get; set; }
    public string? TeacherDisplayName { get; set; }
    public string? TeacherUserName { get; set; }
    public string? TeacherAvatarUrl { get; set; }
    public string? SeoTitle { get; set; }
    public string? MetaDescription { get; set; }
    public string? OgImageUrl { get; set; }
}
