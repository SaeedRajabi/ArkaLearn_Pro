using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetCartRecommendations;

public class GetCartRecommendationsQuery : IQuery<CartRecommendationsQri>, IWebRequest
{
    public List<long> CourseIds { get; set; } = [];
    public string Path => "/api/Service/Course/GetCartRecommendations";
}

public class CartRecommendationsQri
{
    public int PathCompletionPercent { get; set; }
    public int CartCourseCount { get; set; }
    public int PathSize { get; set; }
    public List<CartRecommendationCourseQri> Suggestions { get; set; } = [];
}

public class CartRecommendationCourseQri
{
    public long Id { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? ShortDescription { get; set; }
    public string? TitleImage { get; set; }
    public decimal Price { get; set; }
    public decimal? OriginalPrice { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public long? CategoryId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
}
