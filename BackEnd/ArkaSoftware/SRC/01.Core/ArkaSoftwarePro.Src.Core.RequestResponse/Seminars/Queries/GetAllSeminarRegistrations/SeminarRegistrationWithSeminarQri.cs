namespace ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetAllSeminarRegistrations
{
    public class SeminarRegistrationWithSeminarQri
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public string? UserFullName { get; set; }
        public string? UserName { get; set; }
        public string? Email { get; set; }
        public long SeminarId { get; set; }
        public string? SeminarTitle { get; set; }
        public bool HasPaid { get; set; }
        public string RegisteredAt { get; set; } = string.Empty;
    }
}
