using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.UserFiles.Commands;

[InvalidatesCache(CacheRegion.Files)]
public class CreateUserFolderCommand : ICommand<long>
{
    public long UserId { get; set; }
    public long? ParentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public long? UploadedByUserId { get; set; }
}