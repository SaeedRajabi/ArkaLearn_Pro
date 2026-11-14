using ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Queries.GetCourseStudentsForExam;
using ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Queries.GetExamAttemptForGrading;
using ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Queries.GetExamById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Queries.GetExamForTaking;
using ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Queries.GetMyAssignedExams;
using ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Queries.SearchTeacherExams;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.Exams.ExamRepositoryContracts.Queries;

public interface IExamQueriesRepository
{
    Task<PagedData<SearchTeacherExamQri>> SearchTeacherExamsAsync(SearchTeacherExamsQuery query);
    Task<ExamDetailQri?> GetExamByIdAsync(long examId, long teacherId, bool includeCorrectAnswers);
    Task<List<ExamAttemptSummaryQri>> GetExamAttemptSummariesAsync(long examId, long teacherId);
    Task<List<AssignedExamQri>> GetMyAssignedExamsAsync(long userId);
    Task<ExamTakingQri?> GetExamForTakingAsync(long examId, long userId);
    Task<ExamAttemptGradingQri?> GetAttemptForGradingAsync(long attemptId, long teacherId);
    Task<List<CourseStudentForExamQri>> GetCourseStudentsAsync(long courseId, long teacherId);
    Task<long?> GetStudentIdByUserIdAsync(long userId);
    Task<long?> GetTeacherIdByUserIdAsync(long userId);
    Task<bool> IsStudentAssignedAsync(long examId, long studentId);
    Task<bool> IsCourseOwnedByTeacherAsync(long courseId, long teacherId);
}
