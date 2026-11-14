using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherBookBySlug;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherBooks;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Queries;

public class GetTeacherBookBySlugQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherCommandRepository teacherCommandRepository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<GetTeacherBookBySlugQuery, TeacherBookPublicQri>(outer)
{
    public override async Task<QueryResult<TeacherBookPublicQri>> Handle(GetTeacherBookBySlugQuery query)
    {
        if (string.IsNullOrWhiteSpace(query.Slug))
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        try
        {
            var viewerUserId = ResolveAuthenticatedUserId();
            var book = await teacherCommandRepository.GetAccessibleBookBySlugAsync(
                query.Slug.Trim(),
                viewerUserId > 0 ? viewerUserId : null);
            if (book == null)
                return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

            return await ResultAsync(book, ApplicationServiceStatus.Ok);
        }
        catch (Exception)
        {
            return await ResultAsync(null!, ApplicationServiceStatus.Exception);
        }
    }

    private long ResolveAuthenticatedUserId()
    {
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier || x.Type == "userId" || x.Type == "nameid");
        return claim != null && long.TryParse(claim.Value, out var userId) && userId > 0 ? userId : 0;
    }
}
