using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Courses;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.EducationPlans
{
    public class EducationPlanQueryModel
    {
        public long CoursePlanId { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
        public int HourlyRate { get; set; }
        public int TotalHours { get; set; }
        public decimal? TotalCost { get; set; }
        public long ManagedRoomStudentId { get; set; }
        public long RoomId { get; set; }
        public long OwnerUserId { get; set; }
        public DateTime StartDateUtc { get; set; }
        public DateTime EndDateUtc { get; set; }
        public int UsedMinutes { get; set; }
        public bool IsDelete { get; set; }
        public byte PaymentType { get; set; }
        public decimal BaseTotalCostToman { get; set; }
        public decimal FinalTotalCostToman { get; set; }

        public ICollection<CourseQueryModel> Courses { get; set; } = new List<CourseQueryModel>();
    }
}
