namespace ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetSeminarById
{
    public class SeminarQri
    {
        public long Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public int Capacity { get; set; }
        public int RegisteredCount { get; set; }
        public decimal Price { get; set; }
        public bool IsFree { get; set; }
        public byte Status { get; set; }
        public string? EntryLink { get; set; }
        public string? ThumbnailUrl { get; set; }
        public string? VideoUrl { get; set; }
        public string? RecordingVideoUrl { get; set; }
        public bool IsPublic { get; set; } = true;
        public bool IsExpired { get; set; }
        public bool CanRegister { get; set; }
        public bool HasRecording { get; set; }
        public string? TagsJson { get; set; }
        public string? Prerequisites { get; set; }
        public string? FaqsJson { get; set; }
        public long? RoomId { get; set; }
        /// <summary>عنوان اتاق گفتگو</summary>
        public string? RoomTitle { get; set; }
        /// <summary>لینک ورود به اتاق گفتگو آنلاین (برای کلاینت)</summary>
        public string? RoomLink { get; set; }

        /// <summary>نام مدرس/سخنران (از مالک اتاق)</summary>
        public string? InstructorName { get; set; }
        /// <summary>تصویر پروفایل مدرس</summary>
        public string? InstructorAvatarUrl { get; set; }
        /// <summary>عنوان/سمت مدرس</summary>
        public string? InstructorTitle { get; set; }
        /// <summary>بیوگرافی مدرس</summary>
        public string? InstructorBio { get; set; }
        public string? SeoTitle { get; set; }
        public string? MetaDescription { get; set; }
        public string? OgImageUrl { get; set; }
    }
}
