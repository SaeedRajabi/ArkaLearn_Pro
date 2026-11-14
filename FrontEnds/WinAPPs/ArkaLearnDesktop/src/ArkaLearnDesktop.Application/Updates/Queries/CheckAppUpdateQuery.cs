using ArkaLearnDesktop.Application.Abstractions;
using MediatR;

namespace ArkaLearnDesktop.Application.Updates.Queries;

public sealed record CheckAppUpdateQuery(string CurrentVersion) : IRequest<AppUpdateCheckResult>;

public sealed class CheckAppUpdateQueryHandler(IDesktopApiClient apiClient)
    : IRequestHandler<CheckAppUpdateQuery, AppUpdateCheckResult>
{
    public async Task<AppUpdateCheckResult> Handle(CheckAppUpdateQuery request, CancellationToken cancellationToken)
    {
        try
        {
            return await apiClient.CheckForUpdateAsync(request.CurrentVersion, cancellationToken);
        }
        catch
        {
            // Offline / API down: do not block startup on optional failures.
            return new AppUpdateCheckResult(false, false, request.CurrentVersion, null, null, null);
        }
    }
}
