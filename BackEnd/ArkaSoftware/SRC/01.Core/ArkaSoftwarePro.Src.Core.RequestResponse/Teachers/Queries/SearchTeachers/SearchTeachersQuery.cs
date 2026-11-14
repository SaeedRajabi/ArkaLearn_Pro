using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.SearchTeachers;

[CacheableQuery(CacheRegion.Teachers)]
public class SearchTeachersQuery : PageQuery<PagedData<SearchTeacherQri>>, IWebRequest
{
    public string? InputValue { get; set; }
    public long? TeachingCategoryId { get; set; }
    public long? ViewerUserId { get; set; }
    public bool ForAdmin { get; set; }
    public string Path => "api/Service/Teacher/Search";
}

public class SearchTeacherQri
{
    public long TeacherId { get; set; }
    public long UserId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string AvatarUrl { get; set; } = string.Empty;
    public string? HeaderImageUrl { get; set; }
    public string ShortDescription { get; set; } = string.Empty;
    public string TeachingCategoryName { get; set; } = string.Empty;
    public string TeachingCategorySlug { get; set; } = string.Empty;
    public int PublishedCourseCount { get; set; }
    public int PublishedArticleCount { get; set; }
    public int Points { get; set; }
    public int SupportRatingPoints { get; set; }
    public int SupportRatingCount { get; set; }
    public bool IsFollowing { get; set; }
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public string? AccountStatus { get; set; }
    public bool IsUserBlocked { get; set; }
    public long WalletBalanceToman { get; set; }
    public string? ProfileApprovalStatus { get; set; }
}

public class TeacherTeachingCategoryQri
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
}
