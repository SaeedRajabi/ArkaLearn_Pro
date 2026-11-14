using ArkaSoftwarePro.Src.Core.Contracts.MediaAssets.MediaAssetRepositoryContracts.Commands;

using ArkaSoftwarePro.Src.Core.Domain.MediaAssetAggregate.Entities;

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;

using Framework.Src.Infrastructure.Data.MSSQL.Commands.Extensions;

using Microsoft.EntityFrameworkCore;



namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.MediaAssets.Repositories;



public class MediaAssetCommandRepository(ArkaSoftwareCommandDbContext dbContext)

    : BaseCommandRepository<MediaAsset, ArkaSoftwareCommandDbContext>(dbContext), IMediaAssetCommandRepository

{

    public Task<MediaAsset?> GetActiveByIdAsync(long id) =>
        _dbContext.MediaAssets.FirstOrDefaultAsync(x => x.Id == id && !x.IsDelete);

    public async Task<MediaAsset?> FindActiveByFileUrlAsync(
        string fileUrlOrPath,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(fileUrlOrPath))
            return null;

        var candidates = BuildUrlMatchCandidates(fileUrlOrPath);
        if (candidates.Count == 0)
            return null;

        // Prefer exact match first, then suffix match on path fragments.
        foreach (var candidate in candidates)
        {
            var exact = await _dbContext.MediaAssets
                .Where(x => !x.IsDelete && x.FileUrl == candidate)
                .OrderByDescending(x => x.Id)
                .FirstOrDefaultAsync(cancellationToken);
            if (exact is not null)
                return exact;
        }

        foreach (var candidate in candidates.Where(c => c.Length >= 8))
        {
            var ends = await _dbContext.MediaAssets
                .Where(x => !x.IsDelete && x.FileUrl != null && x.FileUrl.EndsWith(candidate))
                .OrderByDescending(x => x.Id)
                .FirstOrDefaultAsync(cancellationToken);
            if (ends is not null)
                return ends;
        }

        return null;
    }

    private static List<string> BuildUrlMatchCandidates(string fileUrlOrPath)
    {
        var raw = fileUrlOrPath.Trim();
        var list = new List<string>();

        void Add(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return;
            var v = value.Replace('\\', '/').Trim();
            if (v.Length == 0) return;
            if (!list.Contains(v, StringComparer.OrdinalIgnoreCase))
                list.Add(v);
            var withSlash = "/" + v.TrimStart('/');
            if (!list.Contains(withSlash, StringComparer.OrdinalIgnoreCase))
                list.Add(withSlash);
        }

        Add(raw);
        if (Uri.TryCreate(raw, UriKind.Absolute, out var absolute))
            Add(absolute.AbsolutePath);

        var path = raw;
        var q = path.IndexOf('?', StringComparison.Ordinal);
        if (q >= 0) path = path[..q];
        Add(path);

        // Prefer the /public/media/... or /media/... suffix.
        var markers = new[] { "/public/media/", "/media/" };
        foreach (var marker in markers)
        {
            var idx = path.Replace('\\', '/').IndexOf(marker, StringComparison.OrdinalIgnoreCase);
            if (idx >= 0)
                Add(path.Replace('\\', '/')[idx..]);
        }

        return list;
    }

    public async Task<List<MediaAsset>> SearchAsync(

        long? ownerUserId,

        int? mediaType,

        string? search,

        bool includeAllOwners,

        int skip,

        int take)

    {

        var query = BuildSearchQuery(ownerUserId, mediaType, search, includeAllOwners);

        return await query

            .OrderByDescending(x => EF.Property<DateTime?>(x, AuditableShadowProperties.CreatedDateTime))

            .Skip(skip)

            .Take(take)

            .ToListAsync();

    }



    public Task<int> CountAsync(long? ownerUserId, int? mediaType, string? search, bool includeAllOwners) =>

        BuildSearchQuery(ownerUserId, mediaType, search, includeAllOwners).CountAsync();



    private IQueryable<MediaAsset> BuildSearchQuery(long? ownerUserId, int? mediaType, string? search, bool includeAllOwners)

    {

        var query = _dbContext.MediaAssets.AsQueryable().Where(x => !x.IsDelete);

        if (includeAllOwners)

        {

            if (ownerUserId.HasValue)

                query = query.Where(x => x.OwnerUserId == ownerUserId.Value);

        }

        else if (ownerUserId.HasValue)

        {

            query = query.Where(x => x.OwnerUserId == ownerUserId.Value);

        }

        else

        {

            query = query.Where(_ => false);

        }



        if (mediaType.HasValue)

            query = query.Where(x => (int)x.MediaType == mediaType.Value);



        if (!string.IsNullOrWhiteSpace(search))

        {

            var term = search.Trim();

            query = query.Where(x =>

                (x.Title != null && x.Title.Contains(term)) ||

                (x.OriginalFileName != null && x.OriginalFileName.Contains(term)) ||

                (x.AltText != null && x.AltText.Contains(term)) ||

                (x.Caption != null && x.Caption.Contains(term)));

        }



        return query;

    }

}

