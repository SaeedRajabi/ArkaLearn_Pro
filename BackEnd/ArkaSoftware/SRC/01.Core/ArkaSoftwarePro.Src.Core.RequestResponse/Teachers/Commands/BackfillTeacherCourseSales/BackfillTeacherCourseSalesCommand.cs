using Framework.Src.Core.RequestResponse.Commands;

using Framework.Src.Core.RequestResponse.Endpoints;



namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.BackfillTeacherCourseSales;



public class BackfillTeacherCourseSalesCommand : ICommand<BackfillTeacherCourseSalesResult>, IWebRequest

{

    public string Path => "/api/Service/Teacher/BackfillTeacherCourseSales";

}



public class BackfillTeacherCourseSalesResult

{

    public int TotalPaidInvoices { get; set; }

    public int InvoicesCredited { get; set; }

    public int NewSalesCount { get; set; }

}

