using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.EnrollmentAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.EnrollmentAggregate.Events;
using ArkaSoftwarePro.Src.Core.Domain.StudentAggregate.Entities;
using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.EnrollmentAggregate.Entities
{
    /// <summary>
    /// ثبت نام کلاس ها و سمینارهای آنلاین و همچنین دوره ها
    /// </summary>
    public class Enrollment : AggregateRoot
    {
        public bool IsActive { get; private set; }
        public string? SpotPlayerLicense { get; private set; }
        public string? DesktopLicenseKey { get; private set; }
        public bool IsDesktopLicenseActive { get; private set; } = true;
        public DateTime? DesktopLicenseExpiresAtUtc { get; private set; }
        /// <summary>Legacy single-device bind (migrated into DesktopLicenseDeviceBindings).</summary>
        public string? DesktopLicenseBoundDeviceId { get; private set; }
        public int DesktopLicenseMaxDevices { get; private set; } = 1;
        public DesktopOsFamily DesktopLicenseAllowedOs { get; private set; } = DesktopOsFamily.Windows;
        public DesktopContentAccessMode DesktopContentAccessMode { get; private set; } = DesktopContentAccessMode.Full;

        public DateTime EnrollmentDateTime { get; private set; }

        public IReadOnlyList<Payment> Payments => _payments;
        private readonly List<Payment> _payments = new List<Payment>();

        public IReadOnlyList<Installment> Installments => _installments;
        private readonly List<Installment> _installments = new List<Installment>();

        public long? StudentId { get; private set; }
        public Student? Student { get; private set; }

        public long? CourseId { get; private set; }
        public Course? Course { get; private set; }

        #region CTORs

        public Enrollment(long studentId, long courseId, bool isActive)
        {
            StudentId = studentId;
            CourseId = courseId;
            IsActive = isActive;
            EnrollmentDateTime = DateTime.Now;
        }

        public Enrollment()
        {
        }

        #endregion

        #region Methods

        public void AddPayment(decimal amount, PaymentStatus paymentStatus, PaymentMethod paymentMethods, PaymentType paymentType)
        {
            Payment payment = Payment.Create(amount, paymentStatus, paymentMethods, paymentType, Id);
            _payments.Add(payment);
            AddEvent(new PaymentAdded(amount, paymentStatus, paymentMethods, paymentType, Id));
        }

        public void AddInstallment(DateTime dueDate, decimal amount, bool isPaid, DateTime? paidDate)
        {
            AddInstallment(1, dueDate, amount, isPaid, paidDate, null);
        }

        public void AddInstallment(
            int installmentNumber,
            DateTime dueDate,
            decimal amount,
            bool isPaid,
            DateTime? paidDate,
            string? paymentReference = null)
        {
            var installment = Installment.Create(installmentNumber, dueDate, amount, isPaid, paidDate, Id);
            if (isPaid)
                installment.MarkPaid(paymentReference, paidDate ?? DateTime.UtcNow);
            _installments.Add(installment);
            AddEvent(new InstallmentAdded(dueDate, amount, isPaid, paidDate, Id));
        }

        public void ClearInstallments() => _installments.Clear();

        public Installment? GetInstallmentByNumber(int number) =>
            _installments.FirstOrDefault(x => x.InstallmentNumber == number);

        public int GetPaidInstallmentCount() => _installments.Count(x => x.IsPaid);

        public DateTime? GetNextUnpaidDueDate() =>
            _installments
                .Where(x => !x.IsPaid)
                .OrderBy(x => x.InstallmentNumber)
                .Select(x => (DateTime?)x.DueDate)
                .FirstOrDefault();

        public void ApproveSpotPlayerLicense(string license)
        {
            SpotPlayerLicense = license?.Trim() ?? string.Empty;
            IsActive = true;
        }

        /// <summary>
        /// دانشجو درخواست صدور لایسنس دسکتاپ را ثبت می‌کند (تا زمان تأیید استاد).
        /// </summary>
        public void MarkDesktopLicenseRequested()
        {
            SpotPlayerLicense = Services.DesktopLicenseRequestMarkers.Pending;
            IsActive = true;
        }

        public void ClearDesktopLicenseRequestMarker()
        {
            if (Services.DesktopLicenseRequestMarkers.IsPending(SpotPlayerLicense))
                SpotPlayerLicense = null;
        }

        public void AssignDesktopLicense(string licenseKey, DateTime? expiresAtUtc = null)
        {
            DesktopLicenseKey = licenseKey?.Trim() ?? string.Empty;
            IsDesktopLicenseActive = true;
            DesktopLicenseExpiresAtUtc = expiresAtUtc;
            DesktopLicenseBoundDeviceId = null;
            ClearDesktopLicenseRequestMarker();
            if (DesktopLicenseMaxDevices <= 0)
                DesktopLicenseMaxDevices = 1;
            if (DesktopLicenseAllowedOs == DesktopOsFamily.None)
                DesktopLicenseAllowedOs = DesktopOsFamily.Windows;
            IsActive = true;
        }

        public void RevokeDesktopLicense()
        {
            IsDesktopLicenseActive = false;
        }

        /// <summary>
        /// Fully removes desktop license data from the enrollment (key, expiry, bindings flag, access mode).
        /// </summary>
        public void ClearDesktopLicense()
        {
            DesktopLicenseKey = null;
            IsDesktopLicenseActive = false;
            DesktopLicenseExpiresAtUtc = null;
            DesktopLicenseBoundDeviceId = null;
            DesktopLicenseMaxDevices = 1;
            DesktopLicenseAllowedOs = DesktopOsFamily.Windows;
            DesktopContentAccessMode = DesktopContentAccessMode.Full;
        }

        public void RenewDesktopLicense(DateTime? expiresAtUtc)
        {
            IsDesktopLicenseActive = true;
            DesktopLicenseExpiresAtUtc = expiresAtUtc;
        }

        public void RegenerateDesktopLicenseKey(string licenseKey, DateTime? expiresAtUtc = null)
        {
            if (string.IsNullOrWhiteSpace(licenseKey))
                throw new ArgumentException("License key is required.", nameof(licenseKey));

            DesktopLicenseKey = licenseKey.Trim();
            IsDesktopLicenseActive = true;
            DesktopLicenseBoundDeviceId = null;
            DesktopLicenseExpiresAtUtc = expiresAtUtc;
        }

        public void ConfigureDesktopLicenseLimits(int maxDevices, DesktopOsFamily allowedOs)
        {
            DesktopLicenseMaxDevices = Math.Clamp(maxDevices, 1, 20);
            DesktopLicenseAllowedOs = allowedOs == DesktopOsFamily.None ? DesktopOsFamily.Windows : allowedOs;
        }

        public void ConfigureDesktopContentAccess(DesktopContentAccessMode mode)
        {
            DesktopContentAccessMode = mode;
        }

        public bool TryBindOrValidateDesktopLicenseDevice(string deviceId, out string? errorMessage)
        {
            if (string.IsNullOrWhiteSpace(deviceId))
            {
                errorMessage = "شناسه دستگاه نامعتبر است.";
                return false;
            }

            var normalized = deviceId.Trim();
            if (string.IsNullOrWhiteSpace(DesktopLicenseBoundDeviceId))
            {
                DesktopLicenseBoundDeviceId = normalized;
                errorMessage = null;
                return true;
            }

            if (!string.Equals(DesktopLicenseBoundDeviceId, normalized, StringComparison.OrdinalIgnoreCase))
            {
                errorMessage = "این لایسنس قبلاً روی یک سیستم دیگر فعال شده و فقط روی همان سیستم قابل استفاده است.";
                return false;
            }

            errorMessage = null;
            return true;
        }

        public void ClearDesktopLicenseDeviceBinding() => DesktopLicenseBoundDeviceId = null;

        public bool IsDesktopLicenseCurrentlyValid(DateTime utcNow) =>
            IsDesktopLicenseActive
            && !string.IsNullOrWhiteSpace(DesktopLicenseKey)
            && (!DesktopLicenseExpiresAtUtc.HasValue || DesktopLicenseExpiresAtUtc.Value > utcNow);

        #endregion
    }
}
