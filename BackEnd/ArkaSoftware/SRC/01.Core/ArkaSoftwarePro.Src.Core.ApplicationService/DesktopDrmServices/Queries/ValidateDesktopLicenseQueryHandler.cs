using ArkaSoftwarePro.Src.Core.ApplicationService.DesktopDrmServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm.DesktopDrmRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm.DesktopDrmRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Enrollments.EnrollmentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.ValidateDesktopLicense;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.DesktopDrmServices.Queries;

public class ValidateDesktopLicenseQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IDesktopDrmQueryRepository repository,
    IDesktopDrmCommandRepository drmRepository,
    IEnrollmentCommandRepository enrollmentCommandRepository)
    : QueryHandler<ValidateDesktopLicenseQuery, DesktopLicenseValidationQri?>(outer)
{
    public override async Task<QueryResult<DesktopLicenseValidationQri?>> Handle(ValidateDesktopLicenseQuery query)
    {
        if (query.UserId <= 0 || string.IsNullOrWhiteSpace(query.LicenseKey))
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        if (string.IsNullOrWhiteSpace(query.DeviceId))
        {
            AddMessage("شناسه دستگاه برای فعال‌سازی لایسنس الزامی است.");
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);
        }

        var enrollment = await enrollmentCommandRepository.GetByUserIdAndDesktopLicenseKeyAsync(
            query.UserId,
            query.LicenseKey.Trim());

        if (enrollment is null || !enrollment.IsDesktopLicenseCurrentlyValid(DateTime.UtcNow))
        {
            AddMessage("کلید لایسنس نامعتبر، غیرفعال یا منقضی شده است.");
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);
        }

        var (bound, bindMessage) = await DesktopLicenseDeviceBinder.TryBindOrValidateAsync(
            enrollment,
            query.DeviceId,
            query.OsVersion,
            query.MachineName,
            drmRepository);

        if (!bound)
        {
            AddMessage(bindMessage ?? "این لایسنس روی سیستم دیگری فعال است.");
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);
        }

        await enrollmentCommandRepository.CommitAsync();
        await drmRepository.CommitAsync();

        var result = await repository.ValidateDesktopLicenseAsync(query.UserId, query.LicenseKey.Trim());
        if (result is null)
        {
            AddMessage("کلید لایسنس نامعتبر، غیرفعال یا منقضی شده است.");
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);
        }

        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }
}
