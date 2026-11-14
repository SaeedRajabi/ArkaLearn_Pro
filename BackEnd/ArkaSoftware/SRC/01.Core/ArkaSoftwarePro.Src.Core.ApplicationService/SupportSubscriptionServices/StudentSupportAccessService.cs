using ArkaSoftwarePro.Src.Core.Contracts.SupportSubscription;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportSubscriptionServices;

public interface IStudentSupportAccessService
{
    Task<bool> HasActiveStudentAccessAsync(long studentUserId, CancellationToken cancellationToken = default);
}

public sealed class StudentSupportAccessService(IStudentSupportSubscriptionRepository repository)
    : IStudentSupportAccessService
{
    public async Task<bool> HasActiveStudentAccessAsync(long studentUserId, CancellationToken cancellationToken = default)
    {
        if (studentUserId <= 0)
            return false;

        var subscription = await repository.GetByStudentUserIdAsync(studentUserId, cancellationToken);
        if (subscription == null)
            return false;

        return subscription.HasActiveAccess(DateTime.UtcNow);
    }
}
