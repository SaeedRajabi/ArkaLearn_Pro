namespace ArkaSoftwarePro.Src.Core.Contracts.ProjectQuestions;

public interface IProjectQaRealtimeNotifier
{
    Task NotifyAnswerPostedAsync(long projectId, long questionId, long askerUserId);

    Task NotifyQuestionSubmittedAsync(long projectId, long questionId, IReadOnlyList<long> adminUserIds);

    Task NotifyQuestionReviewedAsync(long projectId, long questionId, long askerUserId, bool approved);

    Task NotifyUserNotificationAsync(long userId);

    Task NotifyAdminsNotificationPulseAsync(IReadOnlyList<long> adminUserIds);
}
