using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.UpdateTeacherProfile;

[InvalidatesCache(CacheRegion.Teachers, CacheRegion.Books)]
public class UpdateTeacherProfileCommand : ICommand<string>, IWebRequest
{
    public long UserId { get; set; }
    public string? ShortDescription { get; set; }
    public string? LongDescription { get; set; }
    public string? HeaderImageUrl { get; set; }
    public long? TeachingCategoryId { get; set; }
    public List<TeacherEducationItemDto> Educations { get; set; } = [];
    public List<TeacherSkillItemDto> Skills { get; set; } = [];
    public List<TeacherPromotionalVideoItemDto> PromotionalVideos { get; set; } = [];
    public List<TeacherBookItemDto> Books { get; set; } = [];
    public List<TeacherPortfolioArticleItemDto> PortfolioArticles { get; set; } = [];
    public string Path => "api/Service/Teacher/UpdateProfile";
}

public class TeacherEducationItemDto
{
    public string UniversityName { get; set; } = string.Empty;
    public string DegreeType { get; set; } = "bachelors";
    public string? DegreeImage { get; set; }
}

public class TeacherSkillItemDto
{
    public string Name { get; set; } = string.Empty;
    public int Rate { get; set; }
}

public class TeacherPromotionalVideoItemDto
{
    public string Title { get; set; } = string.Empty;
    public string VideoUrl { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public int SortOrder { get; set; }
}

public class TeacherBookItemDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? CoverImageUrl { get; set; }
    public int SortOrder { get; set; }
}

public class TeacherPortfolioArticleItemDto
{
    public string Title { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}
