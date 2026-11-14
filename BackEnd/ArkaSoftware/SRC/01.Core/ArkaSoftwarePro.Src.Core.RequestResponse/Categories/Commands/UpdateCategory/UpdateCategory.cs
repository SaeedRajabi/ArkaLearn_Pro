using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Categories.Commands.UpdateCategory;

[InvalidatesCache(CacheRegion.Categories)]
public class UpdateCategory : ICommand<string>, IWebRequest
{
    public long CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public IFormFile? CategoryImage { get; set; }
    /// <summary>Parent category id. Use 0 or omit to set as root.</summary>
    public long? ParentId { get; set; }
    public string Path => "/api/Service/Category/update-category";
}
