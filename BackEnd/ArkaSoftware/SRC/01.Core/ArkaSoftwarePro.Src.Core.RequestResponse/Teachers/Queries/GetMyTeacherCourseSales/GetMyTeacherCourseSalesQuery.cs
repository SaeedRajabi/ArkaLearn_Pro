using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetMyTeacherCourseSales;

public class GetMyTeacherCourseSalesQuery : IQuery<List<TeacherCourseSaleQri>>, IWebRequest
{
    public int Take { get; set; } = 50;
    public string Path => "/api/Service/Teacher/GetMyTeacherCourseSales";
}

public class TeacherCourseSaleQri
{
    public long Id { get; set; }
    public long CourseId { get; set; }
    public string CourseTitle { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public long GrossAmountToman { get; set; }
    public long TaxAmountToman { get; set; }
    public long NetAmountToman { get; set; }
    public long InvoiceId { get; set; }
    public long OrderId { get; set; }
    public DateTime SoldAtUtc { get; set; }
}
