using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Software.Commands.SaveTeacherSoftware;

[InvalidatesCache(CacheRegion.Software)]
public class SaveTeacherSoftwareCommand : ICommand<long>, IWebRequest
{
    public long SoftwareId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
    public string LongDescriptionHtml { get; set; } = string.Empty;
    public string? CoverImageUrl { get; set; }
    public string? InstallerFileUrl { get; set; }
    public string? InstallerFileName { get; set; }
    public long? CategoryId { get; set; }
    public List<string> Tags { get; set; } = [];
    public int SortOrder { get; set; }
    public string Path => "/api/Service/Software/SaveTeacherSoftware";
}
