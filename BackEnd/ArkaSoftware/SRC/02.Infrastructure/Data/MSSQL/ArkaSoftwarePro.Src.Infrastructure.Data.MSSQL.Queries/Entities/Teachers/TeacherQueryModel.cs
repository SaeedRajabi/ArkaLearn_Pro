using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Courses;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Users;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Teachers
{
    public class TeacherQueryModel
    {
        public long Id { get; set; }
        public string? LongDescription { get; set; }
        public string? ShortDescription { get; set; }
        public string? HeaderImageUrl { get; set; }
        public long? TeachingCategoryId { get; set; }
        public byte AdvertisingPlan { get; set; }
        public byte ProfileApprovalStatus { get; set; }
        public string? ProfileRejectionNote { get; set; }
        public DateTime? SubmittedAtUtc { get; set; }
        public DateTime? ApprovedAtUtc { get; set; }
        public byte AccountStatus { get; set; }
        public string? AccountStatusNote { get; set; }
        public DateTime? AccountStatusChangedAtUtc { get; set; }

        public long UserId { get; set; }
        public UserQueryModel User { get; set; } = new UserQueryModel();
        public TeacherTeachingCategoryQueryModel? TeachingCategory { get; set; }




        public List<CourseQueryModel> Courses { get; set; } = new List<CourseQueryModel>();
        public List<TeacherEducationQueryModel> TeacherEducations { get; set; } = new List<TeacherEducationQueryModel>();
        public List<ExpertiseAreaQueryModel> ExpertiseAreas { get; set; } = new List<ExpertiseAreaQueryModel>();

    }
}
