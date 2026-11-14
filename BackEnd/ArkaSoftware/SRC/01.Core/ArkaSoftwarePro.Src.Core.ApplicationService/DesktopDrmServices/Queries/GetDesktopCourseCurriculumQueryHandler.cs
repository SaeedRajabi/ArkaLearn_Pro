using ArkaSoftwarePro.Src.Core.ApplicationService.DesktopDrmServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm.DesktopDrmRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetDesktopCourseCurriculum;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.DesktopDrmServices.Queries;

public class GetDesktopCourseCurriculumQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IDesktopDrmQueryRepository repository,
    DesktopAccessEvaluator accessEvaluator)
    : QueryHandler<GetDesktopCourseCurriculumQuery, DesktopCourseCurriculumQri?>(outer)
{
    public override async Task<QueryResult<DesktopCourseCurriculumQri?>> Handle(GetDesktopCourseCurriculumQuery query)
    {
        if (query.UserId <= 0 || query.CourseId <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        var access = await accessEvaluator.EvaluateAsync(query.UserId, deviceId: null, checkVideoPlayback: true);
        if (!access.IsAllowed)
        {
            AddMessage(access.BlockReason ?? "Desktop video access is blocked.");
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);
        }

        if (!string.IsNullOrWhiteSpace(query.LicenseKey))
        {
            var validation = await repository.ValidateDesktopLicenseAsync(query.UserId, query.LicenseKey.Trim());
            if (validation is null || validation.CourseId != query.CourseId)
            {
                AddMessage("Invalid desktop license for this course.");
                return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);
            }
        }

        var curriculum = await repository.GetDesktopCourseCurriculumAsync(query.UserId, query.CourseId);
        if (curriculum is null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        return await ResultAsync(curriculum, ApplicationServiceStatus.Ok);
    }
}
