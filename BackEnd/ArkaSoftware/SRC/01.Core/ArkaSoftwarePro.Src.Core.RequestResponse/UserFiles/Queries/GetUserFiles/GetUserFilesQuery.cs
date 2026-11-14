using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.UserFiles.Queries.GetUserFiles;

/// <summary>
/// Query DTO for GetFiles binding. Listing runs inline in the controller (not via CQRS cache).
/// </summary>
public class GetUserFilesQuery : IQuery<List<GetUserFilesQri>>
{
    public long UserId { get; set; }
    /// <summary>When set, list files for any of these owner ids (portal user + linked managed students).</summary>
    public List<long>? OwnerUserIds { get; set; }
    public long? ParentId { get; set; }
}