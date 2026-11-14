using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.SearchUsersByInputValue
{
    public class SearchUsersByInputValueQuery:PageQuery<PagedData<SearchUsersByInputValueQri>> , IWebRequest
    {
        public string InputValue { get; set; } = string.Empty;
        public string Path => "/api/Service/User/Search";
    }
}
