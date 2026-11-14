using ArkaSoftwarePro.Src.Core.Contracts.MediaUploadSettings.MediaUploadSettingsRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.MediaUploadSettings.Queries.GetMediaUploadSettings;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using RepoMediaUploadSettingsQri = ArkaSoftwarePro.Src.Core.Contracts.MediaUploadSettings.MediaUploadSettingsRepositoryContracts.Queries.MediaUploadSettingsQri;
using ResponseMediaUploadSettingsQri = ArkaSoftwarePro.Src.Core.RequestResponse.MediaUploadSettings.Queries.GetMediaUploadSettings.MediaUploadSettingsQri;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.MediaUploadSettingsServices.Queries;

public class GetMediaUploadSettingsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IMediaUploadSettingsQueryRepository repository)
    : QueryHandler<GetMediaUploadSettingsQuery, ResponseMediaUploadSettingsQri>(outer)
{
    public override async Task<QueryResult<ResponseMediaUploadSettingsQri>> Handle(GetMediaUploadSettingsQuery query)
    {
        RepoMediaUploadSettingsQri? row;
        try
        {
            row = await repository.GetCurrentAsync();
        }
        catch (Exception ex) when (
            ex.Message.Contains("Invalid object name", StringComparison.OrdinalIgnoreCase)
            || ex.InnerException?.Message.Contains("Invalid object name", StringComparison.OrdinalIgnoreCase) == true)
        {
            return await ResultAsync(new ResponseMediaUploadSettingsQri(), ApplicationServiceStatus.Ok);
        }

        if (row is null)
            return await ResultAsync(new ResponseMediaUploadSettingsQri(), ApplicationServiceStatus.Ok);

        return await ResultAsync(new ResponseMediaUploadSettingsQri
        {
            CourseIntroMaxDurationMinutes = row.CourseIntroMaxDurationMinutes,
            PromotionalVideoMaxDurationMinutes = row.PromotionalVideoMaxDurationMinutes,
        }, ApplicationServiceStatus.Ok);
    }
}
