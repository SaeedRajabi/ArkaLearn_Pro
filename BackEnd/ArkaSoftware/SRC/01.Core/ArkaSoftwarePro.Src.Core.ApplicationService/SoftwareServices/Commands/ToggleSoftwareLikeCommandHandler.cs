using ArkaSoftwarePro.Src.Core.Contracts.Software.SoftwareRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.SoftwareAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.Software.Commands.ToggleSoftwareLike;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SoftwareServices.Commands;

public class ToggleSoftwareLikeCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ISoftwareCommandRepository softwareRepository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<ToggleSoftwareLikeCommand, SoftwareLikeResult>(outer)
{
    public override async Task<CommandResult<SoftwareLikeResult>> Handle(ToggleSoftwareLikeCommand command)
    {
        if (command.SoftwareId <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        if (!TryGetUserId(out var userId))
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        var item = await softwareRepository.GetWithTeacherAsync(command.SoftwareId);
        if (item == null || !SoftwareMapper.IsPubliclyVisible(item))
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var alreadyLiked = await softwareRepository.HasUserLikedAsync(command.SoftwareId, userId);
        if (alreadyLiked)
        {
            await softwareRepository.RemoveLikeAsync(command.SoftwareId, userId);
            item.DecrementLike();
            await softwareRepository.CommitAsync();
            return await OkAsync(new SoftwareLikeResult
            {
                Action = "unliked",
                LikeCount = item.LikeCount,
                IsLiked = false,
            });
        }

        await softwareRepository.AddLikeAsync(SoftwareProductLike.Create(command.SoftwareId, userId));
        item.IncrementLike();
        await softwareRepository.CommitAsync();
        return await OkAsync(new SoftwareLikeResult
        {
            Action = "liked",
            LikeCount = item.LikeCount,
            IsLiked = true,
        });
    }

    private bool TryGetUserId(out long userId)
    {
        userId = 0;
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier || x.Type == "userId" || x.Type == "nameid");
        return claim != null && long.TryParse(claim.Value, out userId) && userId > 0;
    }
}
