using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.UserFiles.Commands;

[InvalidatesCache(CacheRegion.Files)]
public class DeleteUserFileCommand : ICommand<string>
{
    public long FileId { get; set; }
    public long UserId { get; set; }
}
