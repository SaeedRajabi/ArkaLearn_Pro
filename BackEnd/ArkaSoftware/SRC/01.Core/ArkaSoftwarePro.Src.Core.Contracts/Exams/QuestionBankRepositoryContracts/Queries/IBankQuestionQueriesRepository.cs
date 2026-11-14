using ArkaSoftwarePro.Src.Core.RequestResponse.QuestionBank.Queries.GetBankQuestionAnalytics;
using ArkaSoftwarePro.Src.Core.RequestResponse.QuestionBank.Queries.GetBankQuestionById;
using ArkaSoftwarePro.Src.Core.RequestResponse.QuestionBank.Queries.SearchBankQuestions;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.Exams.QuestionBankRepositoryContracts.Queries;

public interface IBankQuestionQueriesRepository
{
    Task<PagedData<BankQuestionListItemQri>> SearchAsync(SearchBankQuestionsQuery query);
    Task<BankQuestionDetailQri?> GetByIdAsync(long id, bool includeCorrectAnswers);
    Task<BankQuestionAnalyticsQri> GetAnalyticsAsync(long actorUserId, long? ownerTeacherId, bool isAdmin);
    Task<BankQuestionDetailAnalyticsQri?> GetQuestionAnalyticsAsync(long id);
}
