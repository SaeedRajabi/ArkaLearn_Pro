using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Categories.Commands.DeleteCategory;

[InvalidatesCache(CacheRegion.Categories)]
public class DeleteCategoryCommand : ICommand<string>, IWebRequest
{
    public long CategoryId { get; set; }
    public string Path => "/api/Service/Category/Delete";
}
