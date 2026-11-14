using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Baskets;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Categories;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.EducationPlans;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Rooms;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Tags;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Teachers;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Courses
{
    public class CourseQueryModel
    {
        public long CourseId { get; set; }
        public string? Title { get; set; }
        public decimal? Price { get; set; }
        public decimal? OriginalPrice { get; set; }
        public CourseStatus? Status { get; set; }
        public CourseLevel? CourseLevel { get; set; }
        public string? LogoImage { get; set; }
        public string? Description { get; set; }
        public string? LongDescription { get; set; }
        public float? AverageRateValue { get; set; }
        public byte? NumberOfRatings { get; set; }
        public DateTime CreateAt { get; set; }
        public bool IsPublish { get; set; }
        public TeacherApprovalStatus ModerationStatus { get; set; } = TeacherApprovalStatus.Draft;
        public string? ModerationRejectionNote { get; set; }
        public bool IsCertificate { get; set; }
        public CourseDeliveryMode DeliveryMode { get; set; }
        public string? SpotPlayerCourseKey { get; set; }
        public CourseLifecyclePhase LifecyclePhase { get; set; }
        public DateTime? RegistrationDeadlineUtc { get; set; }
        public DateTime? CourseStartUtc { get; set; }
        public DateTime? CourseEndUtc { get; set; }
        public bool IsRegistrationClosed { get; set; }
        public string? SeoTitle { get; set; }
        public string? MetaDescription { get; set; }
        public string? OgImageUrl { get; set; }
        public string CourseLanguage { get; set; } = "fa";
        public CoursePaymentType PaymentType { get; set; } = CoursePaymentType.Cash;


        public long? CategoryId { get; set; }
        public CategoryQueryModel? Category { get; set; }


        public long? TeacherId { get; set; }
        public TeacherQueryModel? Teacher { get; set; }


        public BasketItemQueryModel BasketItem { get; set; } = new();
        public long? CoursePlanId { get; set; }
        public EducationPlanQueryModel? CoursePlan { get; set; }


        public List<CourseCommentQueryModel> Comments { get; set; } =
            new List<CourseCommentQueryModel>();

        public List<CourseFaqQueryModel> CourseFaqs { get; set; } =
            new List<CourseFaqQueryModel>();

        public List<TagQueryModel> Tags { get; set; }
            = new List<TagQueryModel>();

        public List<CourseSectionQueryModel> Sections { get; set; } 
            = new List<CourseSectionQueryModel>();


        public List<CourseVideoQueryModel> Videos { get; set; }
            = new List<CourseVideoQueryModel>();

        public List<CourseInstallmentPlanQueryModel> InstallmentPlans { get; set; } = new();
    }
}
