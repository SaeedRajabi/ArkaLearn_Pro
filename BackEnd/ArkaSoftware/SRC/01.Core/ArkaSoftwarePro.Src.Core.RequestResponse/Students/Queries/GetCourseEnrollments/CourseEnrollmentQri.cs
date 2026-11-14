namespace ArkaSoftwarePro.Src.Core.RequestResponse.Students.Queries.GetCourseEnrollments
{
    public class CourseEnrollmentQri
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public string? UserFullName { get; set; }
        public string? UserName { get; set; }
        public string? Email { get; set; }
        public long CourseId { get; set; }
        public string? CourseTitle { get; set; }
        public long? TeacherId { get; set; }
        public string? TeacherName { get; set; }
        public bool IsActive { get; set; }
        public string EnrollmentDateTime { get; set; } = string.Empty;
        public string DeliveryMode { get; set; } = "directDownload";
        public string? SpotPlayerLicense { get; set; }
        public bool CanApprove { get; set; }
    }
}
