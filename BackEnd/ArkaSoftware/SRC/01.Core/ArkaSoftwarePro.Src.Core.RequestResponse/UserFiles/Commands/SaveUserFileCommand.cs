using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.UserFiles.Commands;

[InvalidatesCache(CacheRegion.Files)]
public class SaveUserFileCommand : ICommand<long>
{
    public long UserId { get; set; }
    public long? ParentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public bool NotifyStudent { get; set; }
    /// <summary>Portal user id of the teacher who uploaded the file.</summary>
    public long? UploadedByUserId { get; set; }
}