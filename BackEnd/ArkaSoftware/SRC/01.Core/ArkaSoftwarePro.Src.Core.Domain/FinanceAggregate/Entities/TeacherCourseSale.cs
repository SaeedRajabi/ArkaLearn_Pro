using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.FinanceAggregate.Entities;

public class TeacherCourseSale : Entity
{
    public long TeacherId { get; private set; }
    public long CourseId { get; private set; }
    public long OrderId { get; private set; }
    public long InvoiceId { get; private set; }
    public long StudentId { get; private set; }
    public string CourseTitle { get; private set; } = string.Empty;
    public int Quantity { get; private set; }
    public long GrossAmountToman { get; private set; }
    public long TaxAmountToman { get; private set; }
    public long PlatformFeeToman { get; private set; }
    public long NetAmountToman { get; private set; }
    public string PaymentReference { get; private set; } = string.Empty;
    public DateTime SoldAtUtc { get; private set; }

    private TeacherCourseSale() { }

    public static TeacherCourseSale Create(
        long teacherId,
        long courseId,
        long orderId,
        long invoiceId,
        long studentId,
        string courseTitle,
        int quantity,
        long grossAmountToman,
        long taxAmountToman,
        long platformFeeToman,
        long netAmountToman,
        string paymentReference,
        DateTime soldAtUtc)
    {
        return new TeacherCourseSale
        {
            TeacherId = teacherId,
            CourseId = courseId,
            OrderId = orderId,
            InvoiceId = invoiceId,
            StudentId = studentId,
            CourseTitle = courseTitle,
            Quantity = quantity,
            GrossAmountToman = grossAmountToman,
            TaxAmountToman = taxAmountToman,
            PlatformFeeToman = platformFeeToman,
            NetAmountToman = netAmountToman,
            PaymentReference = paymentReference,
            SoldAtUtc = soldAtUtc,
        };
    }
}
