using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.SearchTeacherBooks;

[CacheableQuery(CacheRegion.Books)]
public class SearchTeacherBooksQuery : PageQuery<PagedData<TeacherBookListItemQri>>, IWebRequest
{
    public string Search { get; set; } = string.Empty;
    public string? Tag { get; set; }
    public long? CategoryId { get; set; }
    public string Path => "/api/Service/Teacher/SearchBooks";
}

public class TeacherBookListItemQri
{
    public long Id { get; set; }
    public long TeacherId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
    public string? CoverImageUrl { get; set; }
    public bool HasBookFile { get; set; }
    public string? Publisher { get; set; }
    public int? PublicationYear { get; set; }
    public string? Isbn { get; set; }
    public string Slug { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = [];
    public long? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public List<string> CategoryPath { get; set; } = [];
    public string? TeacherDisplayName { get; set; }
    public string? TeacherUserName { get; set; }
    public string? TeacherAvatarUrl { get; set; }
}
