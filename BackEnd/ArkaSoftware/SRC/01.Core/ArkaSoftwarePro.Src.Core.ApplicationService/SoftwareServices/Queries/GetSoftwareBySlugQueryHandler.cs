using ArkaSoftwarePro.Src.Core.Contracts.Software.SoftwareRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Software.Queries.GetSoftwareBySlug;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using System.Net;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SoftwareServices.Queries;

public class GetSoftwareBySlugQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ISoftwareCommandRepository softwareRepository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<GetSoftwareBySlugQuery, SoftwarePublicQri?>(outer)
{
    public override async Task<QueryResult<SoftwarePublicQri?>> Handle(GetSoftwareBySlugQuery query)
    {
        var slug = WebUtility.UrlDecode(query.Slug?.Trim() ?? string.Empty);
        if (string.IsNullOrWhiteSpace(slug))
            return await ResultAsync(null, ApplicationServiceStatus.Ok);

        var item = await softwareRepository.GetBySlugAsync(slug);
        if (item == null)
            return await ResultAsync(null, ApplicationServiceStatus.Ok);

        TryGetUserId(out var userId);
        var isOwner = userId > 0 && (item.AuthorUserId == userId || item.Teacher?.UserId == userId);
        if (!SoftwareMapper.IsPubliclyVisible(item) && !isOwner)
            return await ResultAsync(null, ApplicationServiceStatus.Ok);

        var isLiked = userId > 0 && await softwareRepository.HasUserLikedAsync(item.Id, userId);
        var categoryPath = await softwareRepository.GetCategoryPathAsync(item.CategoryId);

        return await ResultAsync(SoftwareMapper.ToPublicQri(item, isLiked, categoryPath), ApplicationServiceStatus.Ok);
    }

    private bool TryGetUserId(out long userId)
    {
        userId = 0;
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier || x.Type == "userId" || x.Type == "nameid");
        return claim != null && long.TryParse(claim.Value, out userId) && userId > 0;
    }
}
