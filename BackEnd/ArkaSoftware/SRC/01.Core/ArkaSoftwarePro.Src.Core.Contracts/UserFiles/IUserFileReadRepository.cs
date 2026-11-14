using ArkaSoftwarePro.Src.Core.RequestResponse.UserFiles;
using ArkaSoftwarePro.Src.Core.RequestResponse.UserFiles.Queries.GetUserFiles;

namespace ArkaSoftwarePro.Src.Core.Contracts.UserFiles;

public interface IUserFileReadRepository
{
    Task<List<UserFileSnapshot>> GetOwnerFilesAsync(long userId);
    Task<List<GetUserFilesQri>> GetFilesAsync(IReadOnlyCollection<long> ownerIds, long? parentId);
    Task<UserFileSnapshot?> GetFileAsync(long fileId);
    Task<FileOwnerIdentity?> GetPortalIdentityAsync(long userId);
    Task<List<long>> FindManagedOwnerIdsAsync(string? userName, string? email);
    Task<bool> HasFileUrlAsync(long userId, string fileUrl);
    Task<List<long>> ResolveRelatedFileOwnerIdsAsync(long anyOwnerId);
    Task<long> ResolveCanonicalFileOwnerIdAsync(long anyOwnerId);
    Task<long> ResolveWriteOwnerIdAsync(long requestedOwnerId, long? parentId);
    Task<long?> ResolveExistingFileOwnerIdAsync(long fileId, long requestedOwnerId);
    Task<long?> ResolveManagedStudentIdForFileOwnerAsync(long fileOwnerUserId);
    Task<bool> SiblingNameExistsAsync(long userId, long? parentId, string name);
}
