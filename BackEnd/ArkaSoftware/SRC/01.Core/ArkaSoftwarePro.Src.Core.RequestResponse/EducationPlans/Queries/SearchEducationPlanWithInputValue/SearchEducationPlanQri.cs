namespace ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Queries.SearchEducationPlanWithInputValue
{
    public class SearchEducationPlanQri
    {
        public long Id { get; set; }
        public string? Title { get; set; }
        public int HourlyRate { get; set; }
        public int TotalHours { get; set; }
        public decimal? TotalCost { get; set; }
        public long ManagedRoomStudentId { get; set; }
        public long RoomId { get; set; }
        public DateTime StartDateUtc { get; set; }
        public DateTime EndDateUtc { get; set; }
        public int UsedMinutes { get; set; }
        public int RemainingMinutes { get; set; }
        public string? StudentFullName { get; set; }
        public string? RoomTitle { get; set; }
    }
}
