using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherReviewChanges;

public class GetTeacherReviewChangesQuery : IQuery<TeacherReviewChangesQri>, IWebRequest
{
    public string Path => "api/Service/Teacher/GetReviewChanges";

    public string ReviewType { get; set; } = "profile";
    public long TeacherId { get; set; }
    public long ContentId { get; set; }
}

public class TeacherReviewChangesQri
{
    public string ReviewType { get; set; } = string.Empty;
    public long TeacherId { get; set; }
    public long ContentId { get; set; }
    public bool HasApprovedBaseline { get; set; }
    public List<TeacherReviewFieldChangeQri> Changes { get; set; } = [];
}

public class TeacherReviewFieldChangeQri
{
    public string FieldKey { get; set; } = string.Empty;
    public string FieldLabel { get; set; } = string.Empty;
    public string? PreviousText { get; set; }
    public string? CurrentText { get; set; }
    public string ChangeKind { get; set; } = "modified";
}
