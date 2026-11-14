namespace ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetMyRegisteredSeminars
{
    public class MyRegisteredSeminarQri
    {
        public long SeminarId { get; set; }
        public string? SeminarTitle { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string? RoomLink { get; set; }
        /// <summary>نام کاربری ورود به اتاق (همان ایمیل کاربر)</summary>
        public string? RoomUserName { get; set; }
        public string RegisteredAt { get; set; } = string.Empty;
        public bool HasPaid { get; set; }
    }
}
