using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.SearchTeacherAdvertisements;

public class SearchTeacherAdvertisementsQuery : IQuery<PagedData<TeacherAdvertisementListItemQri>>, IWebRequest
{
    public string? Search { get; set; }
    public string? Tag { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string Path => "api/Service/Teacher/SearchAdvertisements";
}

public class TeacherAdvertisementListItemQri
{
    public long Id { get; set; }
    public long TeacherId { get; set; }
    public long UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal? PrivateTeachingCost { get; set; }
    public decimal? HourlyTeachingCost { get; set; }
    public string? WorkExperience { get; set; }
    public string DescriptionHtml { get; set; } = string.Empty;
    public string? ShortSummary { get; set; }
    public string? SubjectNames { get; set; }
    public string? TeacherDisplayName { get; set; }
    public string? TeacherUserName { get; set; }
    public string? TeacherAvatarUrl { get; set; }
    public string? TeachingCategoryName { get; set; }
    public int Points { get; set; }
    public int SupportRatingPoints { get; set; }
    public int SupportRatingCount { get; set; }
    public int ReviewCount { get; set; }
    public int LikeCount { get; set; }
    public DateTime? MemberSinceUtc { get; set; }
    public int ListingStarLevel { get; set; }
    public DateTime? LastBumpedAtUtc { get; set; }
    public List<string> Tags { get; set; } = [];
}
