using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetMySupportStudents;

public class GetMySupportStudentsQuery : PageQuery<PagedData<SupportStudentListQri>>, IWebRequest
{
    public long TeacherUserId { get; set; }
    public string? Search { get; set; }
    public string Path => "/api/Service/SupportChat/GetMySupportStudents";
}

public class SupportStudentListQri
{
    public long StudentUserId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public int TopicCount { get; set; }
    public int UnreadCount { get; set; }
    public DateTime? LastMessageAtUtc { get; set; }
    public string? LastMessagePreview { get; set; }
}
