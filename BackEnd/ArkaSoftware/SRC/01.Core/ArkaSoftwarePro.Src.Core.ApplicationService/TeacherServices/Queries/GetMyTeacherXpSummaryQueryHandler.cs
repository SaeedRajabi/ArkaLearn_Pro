using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetMyTeacherXpSummary;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Queries;

public class GetMyTeacherXpSummaryQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherCommandRepository teacherCommandRepository,
    IUserCommandRepository userCommandRepository,
    IStudentCommandRepository studentCommandRepository,
    TeacherXpService xpService,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<GetMyTeacherXpSummaryQuery, MyTeacherXpSummaryQri>(outer)
{
    public override async Task<QueryResult<MyTeacherXpSummaryQri>> Handle(GetMyTeacherXpSummaryQuery query)
    {
        var userId = ResolveUserId();
        if (userId <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var teacher = await TeacherProfileProvisioner.EnsureTeacherRecordAsync(
            userId, userCommandRepository, teacherCommandRepository, studentCommandRepository);
        if (teacher == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var settings = await teacherCommandRepository.GetOrCreateMonetizationSettingsAsync();
        var threshold = await xpService.GetNextThresholdAsync(teacher);
        var events = await teacherCommandRepository.GetRecentXpEventsAsync(teacher.Id, 20);

        return await ResultAsync(new MyTeacherXpSummaryQri
        {
            ExperiencePoints = teacher.ExperiencePoints,
            XpNextFreeMonthThreshold = threshold,
            XpFreeMonthsRedeemed = teacher.XpFreeMonthsRedeemed,
            XpFreePlanUntilUtc = teacher.XpFreePlanUntilUtc,
            CanRedeemFreeMonth = teacher.ExperiencePoints >= threshold,
            Rewards = new TeacherXpRewardsQri
            {
                SaveAdvertisement = settings.XpRewardSaveAdvertisement,
                SaveVideo = settings.XpRewardSaveVideo,
                SaveBook = settings.XpRewardSaveBook,
                PublishCourse = settings.XpRewardPublishCourse,
                PublishArticle = settings.XpRewardPublishArticle,
                PortfolioArticle = settings.XpRewardPortfolioArticle,
            },
            RecentEvents = events.Select(e => new TeacherXpEventQri
            {
                Id = e.Id,
                Amount = e.Amount,
                Reason = e.Reason.ToString(),
                Description = e.Description,
                BalanceAfter = e.BalanceAfter,
                OccurredAtUtc = e.OccurredAtUtc,
            }).ToList(),
        }, ApplicationServiceStatus.Ok);
    }

    private long ResolveUserId()
    {
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier || x.Type == "userId" || x.Type == "nameid");
        return claim != null && long.TryParse(claim.Value, out var id) ? id : 0;
    }
}
