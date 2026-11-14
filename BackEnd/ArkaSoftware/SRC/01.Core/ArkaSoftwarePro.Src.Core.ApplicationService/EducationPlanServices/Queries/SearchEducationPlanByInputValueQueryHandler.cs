using ArkaSoftwarePro.Src.Core.Contracts.EducationPlans.EducationPlanRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Queries.SearchEducationPlanWithInputValue;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.EducationPlanServices.Queries
{
    public class SearchEducationPlanByInputValueQueryHandler : QueryHandler<SearchEducationPlanByInputValueQuery, PagedData<SearchEducationPlanQri>>
    {
        private readonly IEducationPlanQueryRepository _educationPlanQueryRepository;
        public SearchEducationPlanByInputValueQueryHandler(ArkaSoftwareCMPOutServices mafiaOuterService , IEducationPlanQueryRepository educationPlanQueryRepository) : base(mafiaOuterService)
        {
            _educationPlanQueryRepository = educationPlanQueryRepository;
        }

        public override async Task<QueryResult<PagedData<SearchEducationPlanQri>>> Handle(SearchEducationPlanByInputValueQuery query)
        {
            try
            {
                var result = await _educationPlanQueryRepository.SearchEducationPlanExecuteAsync(query);
                if (result != null)
                    return await ResultAsync(result, ApplicationServiceStatus.Ok);
                return await ResultAsync(null!, ApplicationServiceStatus.NotFound);
            }
            catch
            {
                return await ResultAsync(null!, ApplicationServiceStatus.Exception);
            }
        }
    }
}
