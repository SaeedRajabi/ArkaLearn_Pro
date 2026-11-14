using ArkaSoftwarePro.Src.Core.Contracts.Tags.TagRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Tags.Queries.GetTagById;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TagsServices.Queries
{
    public class GetTagByIdQueryHandler : QueryHandler<GetTagByIdQuery, TagQri>
    {
        private readonly ITagQueryRepository _tagQueryRepository;
        public GetTagByIdQueryHandler(ArkaSoftwareCMPOutServices mafiaOuterService, ITagQueryRepository tagQueryRepository) : base(mafiaOuterService)
        {
            _tagQueryRepository = tagQueryRepository;
        }

        public override async Task<QueryResult<TagQri>> Handle(GetTagByIdQuery query)
        {
            var result = await _tagQueryRepository.GetTagByIdExecuteAsync(query);
            if (result is null)
                return await ResultAsync(null!, Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.NotFound);
            return await ResultAsync(result, Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.Ok);
        }
    }
}
