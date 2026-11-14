using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Categories.Commands.AddCategories
{
    [InvalidatesCache(CacheRegion.Categories)]
    public class AddCategory : ICommand<string>, IWebRequest
    {
        public long? ParentId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public IFormFile? CategoryImage { get; set; }
        public string Path => "/api/Service/Category/Add";
    }
}
