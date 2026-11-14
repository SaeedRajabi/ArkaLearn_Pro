using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Categories.Commands.UpdateCategoriesName
{
    public class CategoryNameUpdate : ICommand<string>, IWebRequest
    {
        public long CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string Path => "api/Service/Category/CategoryNameUpdate";
    }
}
