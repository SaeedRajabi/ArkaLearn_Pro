using ArkaLearnDesktop.Application.Abstractions;
using MediatR;

namespace ArkaLearnDesktop.Application.Drm.Queries;

public sealed record ListEncryptedMediaQuery : IRequest<IReadOnlyList<DesktopEncryptedMediaItem>>;

public sealed class ListEncryptedMediaQueryHandler(IDesktopApiClient apiClient)
    : IRequestHandler<ListEncryptedMediaQuery, IReadOnlyList<DesktopEncryptedMediaItem>>
{
    public async Task<IReadOnlyList<DesktopEncryptedMediaItem>> Handle(ListEncryptedMediaQuery request, CancellationToken cancellationToken)
        => await apiClient.GetEncryptedMediaAsync(cancellationToken);
}
