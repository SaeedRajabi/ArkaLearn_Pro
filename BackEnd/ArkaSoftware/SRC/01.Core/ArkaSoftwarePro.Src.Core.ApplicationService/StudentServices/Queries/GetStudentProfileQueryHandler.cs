using ArkaSoftwarePro.Src.Core.ApplicationService.StudentServices;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Students.Queries.GetStudentProfile;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.StudentServices.Queries;

public class GetStudentProfileQueryHandler(
    ArkaSoftwareCMPOutServices mafiaOuterServices,
    IStudentQueryRepository studentQueryRepository,
    IStudentCommandRepository studentCommandRepository,
    IUserCommandRepository userCommandRepository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<GetStudentProfileQuery, StudentProfileQri>(mafiaOuterServices)
{
    public override async Task<QueryResult<StudentProfileQri>> Handle(GetStudentProfileQuery query)
    {
        var userId = ResolveAuthenticatedUserId(query.UserId ?? 0, httpContextAccessor);
        if (userId <= 0 && !string.IsNullOrWhiteSpace(query.UserName))
        {
            var user = userCommandRepository.FindByUserNameAsync(query.UserName.Trim());
            if (user != null && user.Id > 0)
                userId = user.Id;
        }

        if (userId <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        await StudentProfileProvisioner.EnsureStudentRecordAsync(
            userId,
            userCommandRepository,
            studentCommandRepository);

        var profile = await studentQueryRepository.GetProfileByUserIdAsync(userId);
        if (profile == null && !string.IsNullOrWhiteSpace(query.UserName))
        {
            await StudentProfileProvisioner.EnsureStudentRecordByUserNameAsync(
                query.UserName,
                userCommandRepository,
                studentCommandRepository);
            profile = await studentQueryRepository.GetProfileByUserIdAsync(userId);
        }

        if (profile == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        return await ResultAsync(profile, ApplicationServiceStatus.Ok);
    }

    private static long ResolveAuthenticatedUserId(long queryUserId, IHttpContextAccessor httpContextAccessor)
    {
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier ||
            x.Type == "userId" ||
            x.Type == "nameid");

        if (claim != null && long.TryParse(claim.Value, out var authUserId) && authUserId > 0)
            return authUserId;

        return queryUserId;
    }
}
