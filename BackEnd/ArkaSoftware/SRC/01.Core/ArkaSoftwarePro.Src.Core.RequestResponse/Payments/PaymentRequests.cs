namespace ArkaSoftwarePro.Src.Core.RequestResponse.Payments;

public class InvoicePaymentRequest
{
    public long InvoiceId { get; set; }
}

public class SeminarPaymentRequest
{
    public long SeminarId { get; set; }
}

public class AdSubscriptionPaymentRequest
{
    public long TariffId { get; set; }
}

public class AdContactUnlockPaymentRequest
{
    public long TeacherId { get; set; }
}

public class AdAutoBumpPackagePaymentRequest
{
    public long PackageId { get; set; }
}

public sealed record PaymentStartResponse(string PaymentUrl, string Provider, string OrderId);

public enum PaymentTargetType
{
    Unknown = 0,
    Invoice = 1,
    Seminar = 2,
    AdSubscription = 3,
    AdContactUnlock = 4,
    AdOneTimeBump = 5,
    AdAutoBumpPackage = 6,
    EducationPlanInstallment = 7,
    SupportSubscription = 8,
    WalletTopUp = 9,
    CourseInstallment = 10
}

public class WalletTopUpRequest
{
    public long AmountToman { get; set; }
}

public class SupportPlanPaymentRequest
{
    public long TariffId { get; set; }
    public List<string> FeatureCodes { get; set; } = [];
}

public class EducationPlanInstallmentPaymentRequest
{
    public long InstallmentId { get; set; }
}

public class CourseInstallmentPaymentRequest
{
    public long InstallmentId { get; set; }
}
