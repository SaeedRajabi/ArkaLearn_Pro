using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.SearchSeminars;
using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.SearchUserSeminars;

public class SearchUserSeminarsQuery : PageQuery<PagedData<SearchSeminarQri>>, IWebRequest
{
    public long TeacherUserId { get; set; }

    public string Path => "/api/Service/Teacher/SearchUserSeminars";
}
