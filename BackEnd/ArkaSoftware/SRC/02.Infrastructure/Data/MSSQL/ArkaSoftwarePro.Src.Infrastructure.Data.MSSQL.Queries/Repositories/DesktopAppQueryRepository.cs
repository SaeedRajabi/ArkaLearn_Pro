using ArkaSoftwarePro.Src.Core.Contracts.DesktopApp.DesktopAppRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopApp.Queries.CheckDesktopAppUpdate;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopApp.Queries.GetDesktopAppReleases;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories;

public class DesktopAppQueryRepository(ArkaSoftwareQueryDbContext dbContext)
    : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext), IDesktopAppQueryRepository
{
    public async Task<DesktopAppUpdateQri> CheckUpdateAsync(
        string? currentVersion,
        CancellationToken cancellationToken = default)
    {
        var latest = await _dbContext.DesktopAppReleases
            .AsNoTracking()
            .Where(x => !x.IsDelete && x.IsPublished)
            .OrderByDescending(x => x.PublishedAtUtc)
            .Select(x => new
            {
                x.Version,
                x.InstallerUrl,
                x.ReleaseNotes,
                x.IsMandatory,
                x.MinSupportedVersion,
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (latest is null)
        {
            return new DesktopAppUpdateQri
            {
                UpdateAvailable = false,
                IsMandatory = false,
                LatestVersion = null,
            };
        }

        var current = NormalizeVersion(currentVersion);
        var latestVersion = NormalizeVersion(latest.Version);
        var updateAvailable = CompareVersions(latestVersion, current) > 0;

        var belowMinSupported = !string.IsNullOrWhiteSpace(latest.MinSupportedVersion)
            && CompareVersions(current, NormalizeVersion(latest.MinSupportedVersion)) < 0;

        var isMandatory = (updateAvailable && latest.IsMandatory) || belowMinSupported;

        return new DesktopAppUpdateQri
        {
            UpdateAvailable = updateAvailable || belowMinSupported,
            IsMandatory = isMandatory,
            LatestVersion = latest.Version,
            InstallerUrl = latest.InstallerUrl,
            ReleaseNotes = latest.ReleaseNotes,
            MinSupportedVersion = latest.MinSupportedVersion,
        };
    }

    public async Task<List<DesktopAppReleaseAdminQri>> ListReleasesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.DesktopAppReleases
            .AsNoTracking()
            .Where(x => !x.IsDelete)
            .OrderByDescending(x => x.PublishedAtUtc)
            .ThenByDescending(x => x.Id)
            .Select(x => new DesktopAppReleaseAdminQri
            {
                Id = x.Id,
                Version = x.Version,
                InstallerUrl = x.InstallerUrl,
                ReleaseNotes = x.ReleaseNotes,
                IsMandatory = x.IsMandatory,
                MinSupportedVersion = x.MinSupportedVersion,
                PublishedAtUtc = x.PublishedAtUtc,
                IsPublished = x.IsPublished,
                PublishedByAdminUserId = x.PublishedByAdminUserId,
            })
            .ToListAsync(cancellationToken);
    }

    private static string NormalizeVersion(string? version)
    {
        if (string.IsNullOrWhiteSpace(version)) return "0.0.0";
        var cleaned = version.Trim().TrimStart('v', 'V');
        return string.IsNullOrWhiteSpace(cleaned) ? "0.0.0" : cleaned;
    }

    /// <summary>Returns &gt;0 if a &gt; b, 0 if equal, &lt;0 if a &lt; b.</summary>
    private static int CompareVersions(string a, string b)
    {
        if (Version.TryParse(Pad(a), out var va) && Version.TryParse(Pad(b), out var vb))
            return va.CompareTo(vb);

        return string.Compare(a, b, StringComparison.OrdinalIgnoreCase);
    }

    private static string Pad(string version)
    {
        var parts = version.Split('.', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        while (parts.Length < 3)
            parts = parts.Concat(["0"]).ToArray();
        return string.Join('.', parts.Take(4));
    }
}
