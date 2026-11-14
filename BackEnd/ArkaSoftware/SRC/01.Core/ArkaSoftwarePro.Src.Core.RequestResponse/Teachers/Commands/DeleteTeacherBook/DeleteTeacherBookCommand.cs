using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.DeleteTeacherBook;

[InvalidatesCache(CacheRegion.Books)]
public class DeleteTeacherBookCommand : ICommand<string>, IWebRequest
{
    public long BookId { get; set; }
    public long? TeacherUserId { get; set; }
    public string Path => "/api/Service/Teacher/DeleteTeacherBook";
}
