namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherProfile;

public class TeacherProfileQri
{
    public long TeacherId { get; set; }
    public long UserId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string AvatarUrl { get; set; } = string.Empty;
    public string Headline { get; set; } = string.Empty;
    public string LongDescription { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
    public string HeaderImageUrl { get; set; } = string.Empty;
    public long? TeachingCategoryId { get; set; }
    public string TeachingCategoryName { get; set; } = string.Empty;
    public string TeachingCategorySlug { get; set; } = string.Empty;
    public string AdvertisingPlan { get; set; } = "free";
    public string ProfileApprovalStatus { get; set; } = "draft";
    public string? ProfileRejectionNote { get; set; }
    public string AccountStatus { get; set; } = "active";
    public string? AccountStatusNote { get; set; }
    public bool CanShowContact { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public int PublishedCourseCount { get; set; }
    public int PublishedArticleCount { get; set; }
    public int Points { get; set; }
    public int StudentCount { get; set; }
    public int ReviewCount { get; set; }
    public int FollowerCount { get; set; }
    public bool IsFollowing { get; set; }
    public List<TeacherEducationQri> Educations { get; set; } = [];
    public List<TeacherSkillQri> Skills { get; set; } = [];
    public List<TeacherCourseSummaryQri> Courses { get; set; } = [];
    public List<TeacherPromotionalVideoQri> PromotionalVideos { get; set; } = [];
    public List<TeacherBookQri> Books { get; set; } = [];
    public List<TeacherPortfolioArticleQri> PortfolioArticles { get; set; } = [];
    public TeacherResumeQri? Resume { get; set; }
}

public class TeacherResumeQri
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string PdfFileUrl { get; set; } = string.Empty;
    public string? PdfFileName { get; set; }
    public string ApprovalStatus { get; set; } = "draft";
}

public class TeacherPromotionalVideoQri
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string VideoUrl { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public string ApprovalStatus { get; set; } = string.Empty;
}

public class TeacherBookQri
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? CoverImageUrl { get; set; }
    public string ApprovalStatus { get; set; } = string.Empty;
}

public class TeacherPortfolioArticleQri
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string ApprovalStatus { get; set; } = string.Empty;
}

public class TeacherEducationQri
{
    public long Id { get; set; }
    public string UniversityName { get; set; } = string.Empty;
    public string DegreeType { get; set; } = string.Empty;
    public string DegreeImage { get; set; } = string.Empty;
}

public class TeacherSkillQri
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Rate { get; set; }
}

public class TeacherCourseSummaryQri
{
    public long CourseId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public decimal Price { get; set; }
    public string Level { get; set; } = string.Empty;
}
