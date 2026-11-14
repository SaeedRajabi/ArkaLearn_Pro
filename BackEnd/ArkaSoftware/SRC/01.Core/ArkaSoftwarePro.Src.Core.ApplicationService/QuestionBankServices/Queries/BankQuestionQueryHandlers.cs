using ArkaSoftwarePro.Src.Core.Contracts.Exams.QuestionBankRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.QuestionBank.Queries.GetBankQuestionAnalytics;
using ArkaSoftwarePro.Src.Core.RequestResponse.QuestionBank.Queries.GetBankQuestionById;
using ArkaSoftwarePro.Src.Core.RequestResponse.QuestionBank.Queries.SearchBankQuestions;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.QuestionBankServices.Queries;

public class SearchBankQuestionsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IBankQuestionQueriesRepository repository)
    : QueryHandler<SearchBankQuestionsQuery, PagedData<BankQuestionListItemQri>>(outer)
{
    public override async Task<QueryResult<PagedData<BankQuestionListItemQri>>> Handle(SearchBankQuestionsQuery query)
        => await ResultAsync(await repository.SearchAsync(query));
}

public class GetBankQuestionByIdQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IBankQuestionQueriesRepository repository)
    : QueryHandler<GetBankQuestionByIdQuery, BankQuestionDetailQri>(outer)
{
    public override async Task<QueryResult<BankQuestionDetailQri>> Handle(GetBankQuestionByIdQuery query)
    {
        var item = await repository.GetByIdAsync(query.Id, query.IncludeCorrectAnswers);
        if (item == null)
            return await ResultAsync(default!, Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.NotFound);
        return await ResultAsync(item);
    }
}

public class GetBankQuestionAnalyticsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IBankQuestionQueriesRepository repository)
    : QueryHandler<GetBankQuestionAnalyticsQuery, BankQuestionAnalyticsQri>(outer)
{
    public override async Task<QueryResult<BankQuestionAnalyticsQri>> Handle(GetBankQuestionAnalyticsQuery query)
        => await ResultAsync(await repository.GetAnalyticsAsync(query.ActorUserId, query.ActorTeacherId, query.IsAdmin));
}

public class GetBankQuestionDetailAnalyticsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IBankQuestionQueriesRepository repository)
    : QueryHandler<GetBankQuestionDetailAnalyticsQuery, BankQuestionDetailAnalyticsQri>(outer)
{
    public override async Task<QueryResult<BankQuestionDetailAnalyticsQri>> Handle(GetBankQuestionDetailAnalyticsQuery query)
    {
        var item = await repository.GetQuestionAnalyticsAsync(query.Id);
        if (item == null)
            return await ResultAsync(default!, Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.NotFound);
        return await ResultAsync(item);
    }
}
