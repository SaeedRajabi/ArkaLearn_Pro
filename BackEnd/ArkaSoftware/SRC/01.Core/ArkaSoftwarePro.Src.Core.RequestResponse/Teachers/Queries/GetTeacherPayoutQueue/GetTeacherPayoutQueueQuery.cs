using Framework.Src.Core.RequestResponse.Endpoints;

using Framework.Src.Core.RequestResponse.Queries;



namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherPayoutQueue;



public class GetTeacherPayoutQueueQuery : IQuery<List<AdminTeacherPayoutQri>>, IWebRequest

{

    public string? Status { get; set; }

    public int Take { get; set; } = 50;

    public string Path => "/api/Service/Teacher/GetTeacherPayoutQueue";

}



public class AdminTeacherPayoutQri

{

    public long Id { get; set; }

    public long TeacherId { get; set; }

    public string TeacherName { get; set; } = string.Empty;

    public string TeacherEmail { get; set; } = string.Empty;

    public long AmountToman { get; set; }

    public string Status { get; set; } = string.Empty;

    public DateTime RequestedAtUtc { get; set; }

    public DateTime? ProcessedAtUtc { get; set; }

    public string? TeacherNote { get; set; }

    public string? AdminNote { get; set; }

    public string? TransferReference { get; set; }

}

