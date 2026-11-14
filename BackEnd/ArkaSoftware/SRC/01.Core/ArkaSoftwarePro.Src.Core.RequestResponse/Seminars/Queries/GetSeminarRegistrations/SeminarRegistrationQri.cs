namespace ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetSeminarRegistrations
{
    public class SeminarRegistrationQri
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public string? UserFullName { get; set; }
        public string? UserName { get; set; }
        public string? Email { get; set; }
        public bool HasPaid { get; set; }
        public string RegisteredAt { get; set; } = string.Empty;
    }
}
