using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.SearchAdminSupportTeachers;

public class SearchAdminSupportTeachersQuery : PageQuery<PagedData<AdminSupportTeacherQri>>, IWebRequest
{
    public string? InputValue { get; set; }
    public string Path => "/api/Service/SupportChatAdmin/SearchTeachers";
}

public class AdminSupportTeacherQri
{
    public long TeacherId { get; set; }
    public long TeacherUserId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public int StudentCount { get; set; }
    public int ConversationCount { get; set; }
}
