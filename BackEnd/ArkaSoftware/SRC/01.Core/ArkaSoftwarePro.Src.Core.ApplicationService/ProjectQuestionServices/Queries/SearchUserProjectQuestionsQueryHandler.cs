using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.ProjectQuestions.ProjectQuestionRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectQuestions.Queries.SearchProjectQuestions;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectQuestions.Queries.SearchUserProjectQuestions;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ProjectQuestionServices.Queries;

public class SearchUserProjectQuestionsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IProjectQuestionQueriesRepository repository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<SearchUserProjectQuestionsQuery, PagedData<SearchProjectQuestionQri>>(outer)
{
    public override async Task<QueryResult<PagedData<SearchProjectQuestionQri>>> Handle(SearchUserProjectQuestionsQuery query)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
            return await ResultAsync(new PagedData<SearchProjectQuestionQri>(), ApplicationServiceStatus.ValidationError);

        if (query.UserId <= 0)
            return await ResultAsync(new PagedData<SearchProjectQuestionQri>(), ApplicationServiceStatus.ValidationError);

        var result = await repository.SearchAsync(new SearchProjectQuestionsQuery
        {
            SubmitterUserId = query.UserId,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize,
            NeedTotalCount = query.NeedTotalCount,
        });

        return await ResultAsync(result ?? new PagedData<SearchProjectQuestionQri>(), ApplicationServiceStatus.Ok);
    }
}
