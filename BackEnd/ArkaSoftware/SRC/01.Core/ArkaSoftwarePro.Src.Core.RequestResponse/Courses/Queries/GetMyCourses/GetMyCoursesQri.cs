namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetMyCourses
{
    public class GetMyCoursesQri
    {
        public long Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string? SpotPlayerToken { get; set; }
        public string? DesktopLicenseKey { get; set; }
        public string? OnlineClassUrl { get; set; }
        public int Progress { get; set; }
        public string Status { get; set; } = "Active";
        public string EnrollmentDateTime { get; set; } = string.Empty;
        public bool IsFree { get; set; }
        public decimal Price { get; set; }
        public string DeliveryMode { get; set; } = "directDownload";
        public bool IsActive { get; set; }
        public bool IsPendingApproval { get; set; }
        /// <summary>دانشجو درخواست لایسنس دسکتاپ داده و منتظر تأیید استاد است.</summary>
        public bool IsLicenseRequestPending { get; set; }
        public string LifecyclePhase { get; set; } = "notStarted";
        public string EffectiveLifecyclePhase { get; set; } = "notStarted";
    }
}
