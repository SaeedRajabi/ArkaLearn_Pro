using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.ManagedRoomStudents.Queries.GetManagedRoomStudentsPaged;

public class GetManagedRoomStudentsPagedQuery : PageQuery<PagedData<GetManagedRoomStudentsPagedQri>>, IWebRequest
{
    public string InputValue { get; set; } = string.Empty;

    /// <summary>When set, limits results to students linked to this teacher's courses, seminars, rooms, or education plans.</summary>
    public long? TeacherUserId { get; set; }

    public string Path => "/api/Service/ManagedRoomStudent/Search";
}
