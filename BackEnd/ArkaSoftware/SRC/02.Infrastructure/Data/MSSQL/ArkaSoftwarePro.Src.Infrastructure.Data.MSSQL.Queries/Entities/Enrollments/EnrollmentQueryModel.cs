using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Enumerations;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Enrollments
{
    public class EnrollmentQueryModel
    {
        public long Id { get; set; }
        public long StudentId { get; set; }
        public long CourseId { get; set; }
        public bool IsActive { get; set; }
        public string? SpotPlayerLicense { get; set; }
        public string? DesktopLicenseKey { get; set; }
        public bool IsDesktopLicenseActive { get; set; } = true;
        public DateTime? DesktopLicenseExpiresAtUtc { get; set; }
        public string? DesktopLicenseBoundDeviceId { get; set; }
        public int DesktopLicenseMaxDevices { get; set; } = 1;
        public DesktopOsFamily DesktopLicenseAllowedOs { get; set; } = DesktopOsFamily.Windows;
        public DesktopContentAccessMode DesktopContentAccessMode { get; set; } = DesktopContentAccessMode.Full;
        public DateTime EnrollmentDateTime { get; set; }
    }
}
