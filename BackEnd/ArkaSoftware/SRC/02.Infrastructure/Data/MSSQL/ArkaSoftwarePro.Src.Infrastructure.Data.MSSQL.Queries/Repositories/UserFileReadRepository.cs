using ArkaSoftwarePro.Src.Core.Contracts.UserFiles;
using ArkaSoftwarePro.Src.Core.RequestResponse.UserFiles;
using ArkaSoftwarePro.Src.Core.RequestResponse.UserFiles.Queries.GetUserFiles;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories;

public sealed class UserFileReadRepository(ArkaSoftwareQueryDbContext queryDbContext) : IUserFileReadRepository
{
    public async Task<List<UserFileSnapshot>> GetOwnerFilesAsync(long userId) =>
        (await queryDbContext.UserFiles.AsNoTracking().Where(file => file.UserId == userId).ToListAsync())
        .Select(file => new UserFileSnapshot(file.Id, file.UserId, file.ParentId, file.Name, file.IsFolder,
            file.FileUrl, file.FileSize, file.CreatedAt, file.UploadedByUserId)).ToList();

    public Task<List<GetUserFilesQri>> GetFilesAsync(IReadOnlyCollection<long> ownerIds, long? parentId) =>
        queryDbContext.UserFiles.AsNoTracking().Where(file => ownerIds.Contains(file.UserId) && file.ParentId == parentId)
        .OrderByDescending(file => file.IsFolder).ThenBy(file => file.Name)
        .Select(file => new GetUserFilesQri { Id = file.Id, UserId = file.UserId, ParentId = file.ParentId,
            Name = file.Name, IsFolder = file.IsFolder, FileUrl = file.FileUrl, FileSize = file.FileSize, CreatedAt = file.CreatedAt })
        .ToListAsync();

    public async Task<UserFileSnapshot?> GetFileAsync(long fileId)
    {
        var file = await queryDbContext.UserFiles.AsNoTracking().FirstOrDefaultAsync(file => file.Id == fileId);
        return file is null ? null : new UserFileSnapshot(file.Id, file.UserId, file.ParentId, file.Name, file.IsFolder,
            file.FileUrl, file.FileSize, file.CreatedAt, file.UploadedByUserId);
    }

    public Task<FileOwnerIdentity?> GetPortalIdentityAsync(long userId) =>
        queryDbContext.Users.AsNoTracking().Where(user => user.Id == userId)
            .Select(user => new FileOwnerIdentity(user.UserName, user.Email, user.FirstName, user.LastName)).FirstOrDefaultAsync();

    public Task<List<long>> FindManagedOwnerIdsAsync(string? userName, string? email) =>
        queryDbContext.ManagedRoomStudents.AsNoTracking().Where(student => !student.IsDelete &&
            ((!string.IsNullOrWhiteSpace(userName) && student.UserName == userName) ||
             (!string.IsNullOrWhiteSpace(email) && student.Email != null && student.Email == email)))
            .Select(student => student.Id).ToListAsync();

    public Task<bool> HasFileUrlAsync(long userId, string fileUrl) =>
        queryDbContext.UserFiles.AsNoTracking().AnyAsync(file => file.UserId == userId && file.FileUrl == fileUrl);
    public async Task<List<long>> ResolveRelatedFileOwnerIdsAsync(long anyOwnerId)
    {
        var ids = new HashSet<long>();
        if (anyOwnerId <= 0)
            return ids.ToList();

        ids.Add(anyOwnerId);

        try
        {
            string? userName = null;
            string? email = null;

            var managed = await queryDbContext.ManagedRoomStudents.AsNoTracking()
                .Where(x => x.Id == anyOwnerId && !x.IsDelete)
                .Select(x => new { x.UserName, x.Email })
                .FirstOrDefaultAsync();

            if (managed != null)
            {
                userName = managed.UserName?.Trim();
                email = managed.Email?.Trim();
            }
            else
            {
                var user = await queryDbContext.Users.AsNoTracking()
                    .Where(u => u.Id == anyOwnerId)
                    .Select(u => new { u.UserName, u.Email })
                    .FirstOrDefaultAsync();
                if (user != null)
                {
                    userName = user.UserName?.Trim();
                    email = user.Email?.Trim();
                }
            }

            if (string.IsNullOrWhiteSpace(userName) && string.IsNullOrWhiteSpace(email))
                return ids.ToList();

            var emailLower = string.IsNullOrWhiteSpace(email) ? null : email.ToLowerInvariant();
            var hasUserName = !string.IsNullOrWhiteSpace(userName);
            var hasEmail = !string.IsNullOrWhiteSpace(emailLower);

            // Prefer username match; email match only when we have a value (avoids odd EF translations).
            if (hasUserName)
            {
                var managedByName = await queryDbContext.ManagedRoomStudents.AsNoTracking()
                    .Where(x => !x.IsDelete && x.UserName == userName)
                    .Select(x => x.Id)
                    .ToListAsync();
                foreach (var id in managedByName)
                    ids.Add(id);

                var portalByName = await queryDbContext.Users.AsNoTracking()
                    .Where(u => u.UserName == userName)
                    .Select(u => u.Id)
                    .ToListAsync();
                foreach (var id in portalByName)
                    ids.Add(id);
            }

            if (hasEmail)
            {
                var managedByEmail = await queryDbContext.ManagedRoomStudents.AsNoTracking()
                    .Where(x => !x.IsDelete && x.Email != null && x.Email.ToLower() == emailLower)
                    .Select(x => x.Id)
                    .ToListAsync();
                foreach (var id in managedByEmail)
                    ids.Add(id);

                var portalByEmail = await queryDbContext.Users.AsNoTracking()
                    .Where(u => u.Email != null && u.Email.ToLower() == emailLower)
                    .Select(u => u.Id)
                    .ToListAsync();
                foreach (var id in portalByEmail)
                    ids.Add(id);
            }
        }
        catch
        {
            // Fall back to the single owner id so file listing still works.
        }

        return ids.ToList();
    }

    public async Task<long> ResolveCanonicalFileOwnerIdAsync(long anyOwnerId)
    {
        if (anyOwnerId <= 0)
            return anyOwnerId;

        var isManaged = await queryDbContext.ManagedRoomStudents.AsNoTracking()
            .AnyAsync(x => x.Id == anyOwnerId && !x.IsDelete);
        if (isManaged)
            return anyOwnerId;

        var related = await ResolveRelatedFileOwnerIdsAsync(anyOwnerId);
        var managedIds = await queryDbContext.ManagedRoomStudents.AsNoTracking()
            .Where(x => !x.IsDelete && related.Contains(x.Id))
            .OrderByDescending(x => x.Id)
            .Select(x => x.Id)
            .ToListAsync();

        var preferred = managedIds.FirstOrDefault();
        return preferred > 0 ? preferred : anyOwnerId;
    }

    public async Task<long> ResolveWriteOwnerIdAsync(long requestedOwnerId, long? parentId)
    {
        if (parentId is > 0)
        {
            var parentOwnerId = await queryDbContext.UserFiles.AsNoTracking()
                .Where(x => x.Id == parentId.Value)
                .Select(x => (long?)x.UserId)
                .FirstOrDefaultAsync();

            if (parentOwnerId is > 0)
            {
                var related = await ResolveRelatedFileOwnerIdsAsync(requestedOwnerId);
                if (related.Contains(parentOwnerId.Value))
                    return parentOwnerId.Value;
            }
        }

        return await ResolveCanonicalFileOwnerIdAsync(requestedOwnerId);
    }

    public async Task<long?> ResolveExistingFileOwnerIdAsync(long fileId, long requestedOwnerId)
    {
        if (fileId <= 0 || requestedOwnerId <= 0)
            return null;

        var fileOwnerId = await queryDbContext.UserFiles.AsNoTracking()
            .Where(x => x.Id == fileId)
            .Select(x => (long?)x.UserId)
            .FirstOrDefaultAsync();

        if (fileOwnerId is null or <= 0)
            return null;

        var related = await ResolveRelatedFileOwnerIdsAsync(requestedOwnerId);
        return related.Contains(fileOwnerId.Value) ? fileOwnerId.Value : null;
    }

    public async Task<long?> ResolveManagedStudentIdForFileOwnerAsync(long fileOwnerUserId)
    {
        if (fileOwnerUserId <= 0)
            return null;

        var isManagedStudent = await queryDbContext.ManagedRoomStudents
            .AsNoTracking()
            .AnyAsync(x => x.Id == fileOwnerUserId && !x.IsDelete);
        if (isManagedStudent)
            return fileOwnerUserId;

        var related = await ResolveRelatedFileOwnerIdsAsync(fileOwnerUserId);
        foreach (var id in related)
        {
            if (id == fileOwnerUserId)
                continue;

            var matched = await queryDbContext.ManagedRoomStudents
                .AsNoTracking()
                .AnyAsync(x => x.Id == id && !x.IsDelete);
            if (matched)
                return id;
        }

        return null;
    }

    public async Task<bool> SiblingNameExistsAsync(long userId, long? parentId, string name)
    {
        var normalized = (name ?? string.Empty).Trim().ToLowerInvariant();
        if (userId <= 0 || string.IsNullOrEmpty(normalized))
            return false;

        return await queryDbContext.UserFiles
            .AsNoTracking()
            .AnyAsync(x =>
                x.UserId == userId
                && x.ParentId == parentId
                && x.Name.ToLower() == normalized);
    }
}
