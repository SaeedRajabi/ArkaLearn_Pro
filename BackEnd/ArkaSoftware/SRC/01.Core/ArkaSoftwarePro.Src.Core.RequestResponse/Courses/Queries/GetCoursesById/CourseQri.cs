using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetCoursesById
{
    public class CourseQri
    {
        public long CourseId { get; set; }
        public string Slug { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Status { get; set; }
        public decimal Price { get; set; }
        public decimal? OriginalPrice { get; set; }
        /// <summary>مبلغ قابل‌پرداخت در سبد: قسط اول یا قیمت نقدی</summary>
        public decimal CheckoutPrice { get; set; }
        /// <summary>cash | installment</summary>
        public string PaymentType { get; set; } = "cash";
        public List<CourseInstallmentPlanQri> InstallmentPlans { get; set; } = new();
        public string? shortDescription { get; set; }
        public string? Description { get; set; }
        public string? ThumbnailUrl { get; set; }
        public string? CreatedAt { get; set; }
        public string? Level { get; set; } = string.Empty;
        public int CourseRate { get; set; }
        public string Category { get; set; } = string.Empty;
        public long CategoryId { get; set; }
        public List<string> CategoryPath { get; set; } = new();
        /// <summary>beginner | intermediate | advanced</summary>
        public string LevelCode { get; set; } = "beginner";
        public List<string>? CourseTags { get; set; }
        public int VideoCount { get; set; }
        public bool IsCertificate { get; set; }
        public bool IsPublish { get; set; }
        public string? ModerationStatus { get; set; }
        public string? ModerationRejectionNote { get; set; }
        public string DeliveryMode { get; set; } = "directDownload";
        public string? SpotPlayerCourseKey { get; set; }
        public string LifecyclePhase { get; set; } = "notStarted";
        public string? EffectiveLifecyclePhase { get; set; }
        public DateTime? RegistrationDeadlineUtc { get; set; }
        public DateTime? CourseStartUtc { get; set; }
        public DateTime? CourseEndUtc { get; set; }
        public string? SeoTitle { get; set; }
        public string? MetaDescription { get; set; }
        public string? OgImageUrl { get; set; }
        /// <summary>fa | en</summary>
        public string Language { get; set; } = "fa";
        public bool CanRegister { get; set; } = true;
        public bool IsRegistrationClosed { get; set; }
        public string VideoUrl { get; set; } = string.Empty;

        public string TeacherName { get; set; } = string.Empty;
        public string TeacherUserName { get; set; } = string.Empty;
        public long TeacherId { get; set; }
        public string TeacherBio { get; set; } = string.Empty;

        public string EducationTitle { get; set; } = string.Empty;
        public string TeacherProfileImage { get; set; } = string.Empty;
        public int TeacherPublishedCourseCount { get; set; }
        public int TeacherPublishedArticleCount { get; set; }
        public int TeacherPoints { get; set; }
        public int TeacherStudentCount { get; set; }
        public int TeacherReviewCount { get; set; }
        public int EnrollmentCount { get; set; }

        public List<string> Tags { get; set; } = new List<string>();
        public List<string> Dependencies { get; set; } = new List<string>();


        public List<CourseSessionQri> Sections { get; set; } = new List<CourseSessionQri>();

        public List<CourseCommentQri>? Comments { get; set; } = new List<CourseCommentQri>();

        public List<CourseFaqQri>? FAQs { get; set; } = new List<CourseFaqQri>();



    }
}
