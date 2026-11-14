using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.AddCourses
{
    [InvalidatesCache(CacheRegion.Courses)]
    public class AddCourse : ICommand<string>, IWebRequest
    {

        public string Title { get; set; } = string.Empty;
        public IFormFile? TitleImage { get; set; }
        public IFormFile? VideoInfo { get; set; }
        public int? IntroVideoDurationSeconds { get; set; }
        /// <summary>Pre-uploaded title image URL (immediate upload flow).</summary>
        public string? TitleImageUrl { get; set; }
        /// <summary>Pre-uploaded intro video URL (immediate upload flow).</summary>
        public string? VideoInfoUrl { get; set; }
        public string? Description { get; set; } = string.Empty;
        public string? LongDescription { get; set; } = string.Empty;
        public string? CourseLevel { get; set; }
        public decimal CoursePrice { get; set; }
        public decimal? OriginalPrice { get; set; }
        public long CategoryId { get; set; }
        public long TeacherId { get; set; }
        public long UserId { get; set; }
        
        public string? SessionsJson { get; set; }
        public string? KeywordsJson { get; set; }
        public string? DependenciesJson { get; set; }
        public string? QuestionJson { get; set; }
        public bool IsPublish { get; set; }
        public bool IsRegistrationClosed { get; set; }
        public bool IsCertificate { get; set; }
        public string? DeliveryMode { get; set; }
        public string? SpotPlayerCourseKey { get; set; }
        public string? LifecyclePhase { get; set; }
        public string? RegistrationDeadlineUtc { get; set; }
        public string? CourseStartUtc { get; set; }
        public string? CourseEndUtc { get; set; }
        public string? SeoTitle { get; set; }
        public string? MetaDescription { get; set; }
        public string? OgImageUrl { get; set; }
        public string? Language { get; set; }
        /// <summary>Cash | Installment</summary>
        public string? PaymentType { get; set; }
        /// <summary>JSON array of { installmentNumber, amountToman, dueDateUtc }</summary>
        public string? InstallmentPlansJson { get; set; }

        public string Path => "/api/Service/Course/Add";
    }


    public class CourseSessionDto
    {
        public string? Id { get; set; }
        public string? Title { get; set; }
        public List<CourseLessonDto>? Lessons { get; set; }
    }
    public class CourseFaqDto
    {
        public string? Question { get; set; }
        public string? Answer { get; set; }
    }

    public class CourseLessonDto
    {
        public string? Id { get; set; }
        public string? Title { get; set; }
        public string? VideoTitle { get; set; }
        public string? VideoUrl { get; set; }
        /// <summary>Pre-uploaded encrypted media asset (desktop license immediate upload).</summary>
        public long? MediaAssetId { get; set; }
        public int? DurationSeconds { get; set; }
        public bool RemoveVideo { get; set; }
        public bool? IsPublished { get; set; }
    }

    public class CourseInstallmentPlanDto
    {
        public int InstallmentNumber { get; set; }
        public decimal AmountToman { get; set; }
        public DateTime? DueDateUtc { get; set; }
    }

}
