using ArkaLearnDesktop.Application.Abstractions;
using MediatR;

namespace ArkaLearnDesktop.Application.Drm.Commands;

public sealed record PlayEncryptedMediaCommand(
    long MediaAssetId,
    long? CourseId,
    string? EncryptedFileUrl,
    long? OwnerUserIdForToken = null) : IRequest<PlayEncryptedMediaResult>;

public sealed record PlayEncryptedMediaResult(bool Success, string? ErrorMessage, Uri? PlaybackUri);
