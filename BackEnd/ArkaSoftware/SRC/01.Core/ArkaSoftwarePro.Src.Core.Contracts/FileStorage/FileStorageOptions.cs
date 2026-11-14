namespace ArkaSoftwarePro.Src.Core.Contracts.FileStorage;

public sealed class FileStorageOptions
{
    public const string SectionName = "FileStorage";

    /// <summary>Local | Msg | Ftp | Composite (Ftp+Local dual-read)</summary>
    public string Provider { get; set; } = "Ftp";

    public string PublicBaseUrl { get; set; } = "https://msg.arkasoftware.ir";

    /// <summary>Public API origin used for signed private/drm download links (no Agent on msg).</summary>
    public string SignedReadBaseUrl { get; set; } = "https://api.arkasoftware.ir";

    public string AgentBaseUrl { get; set; } = "https://msg.arkasoftware.ir";
    public string AgentToken { get; set; } = string.Empty;
    public string SigningKey { get; set; } = string.Empty;
    public int SignedUrlTtlSeconds { get; set; } = 900;
    public string LocalWwwRootRelative { get; set; } = "wwwroot";
    public bool DeleteLocalAfterMigrate { get; set; } = false;
    public bool MigrationEnabled { get; set; } = true;

    /// <summary>
    /// FTP host of the download server. Prefer the download-host IP when msg DNS
    /// has multiple A records (main site IP often rejects this FTP user with 530).
    /// </summary>
    public string FtpHost { get; set; } = string.Empty;
    public int FtpPort { get; set; } = 21;
    public string FtpUsername { get; set; } = string.Empty;
    public string FtpPassword { get; set; } = string.Empty;

    /// <summary>
    /// Remote folder that maps to the website document root (usually httpdocs).
    /// Files are stored as {FtpRemoteRoot}/public|private|drm/...
    /// </summary>
    public string FtpRemoteRoot { get; set; } = "httpdocs";

    public bool FtpUseTls { get; set; } = false;

    /// <summary>Download-host plan capacity (50 GiB); override to match the hosting plan.</summary>
    public long DownloadHostCapacityBytes { get; set; } = 50L * 1024 * 1024 * 1024;

    /// <summary>FTP account directory whose files count toward the plan, including pending uploads.</summary>
    public string FtpUsageRoot { get; set; } = "/";
}
