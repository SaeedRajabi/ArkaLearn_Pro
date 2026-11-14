using ArkaSoftwarePro.Src.Core.Contracts.Tags.TagRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Tags.Queries.SearchTagByInputValue;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TagsServices.Queries
{
    public class SearchTagQueryHandler : QueryHandler<SearchTagQuery, PagedData<SearchTagQri>>
    {
        private readonly ITagQueryRepository _tagQueryRepository;
        public SearchTagQueryHandler(ArkaSoftwareCMPOutServices mafiaOuterService, ITagQueryRepository tagQueryRepository) : base(mafiaOuterService)
        {
            _tagQueryRepository = tagQueryRepository;
        }

        public override async Task<QueryResult<PagedData<SearchTagQri>>> Handle(SearchTagQuery query)
        {
            var result = await _tagQueryRepository.SearchTagExecuteAsync(query);
            if (result is null)
                return await ResultAsync(null!, Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.NotFound);
            return await ResultAsync(result, Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.Ok);
        }
    }
}
