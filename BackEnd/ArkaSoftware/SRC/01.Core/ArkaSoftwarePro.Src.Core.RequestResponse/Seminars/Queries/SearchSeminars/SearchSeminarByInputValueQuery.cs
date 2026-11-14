using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.SearchSeminars
{
    [CacheableQuery(CacheRegion.Seminars)]
    public class SearchSeminarByInputValueQuery : PageQuery<PagedData<SearchSeminarQri>>, IWebRequest
    {
        public string InputValue { get; set; } = string.Empty;
        public byte? Status { get; set; }
        /// <summary>When true, only Published + IsPublic seminars (client catalog).</summary>
        public bool OnlyClientVisible { get; set; }
        public DateTime? From { get; set; }
        public DateTime? To { get; set; }
        public string Path => "/api/Service/Seminar/Search";
    }
}
