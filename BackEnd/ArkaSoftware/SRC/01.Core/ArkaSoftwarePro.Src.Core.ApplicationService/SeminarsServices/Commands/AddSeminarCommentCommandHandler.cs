using ArkaSoftwarePro.Src.Core.Contracts.Seminars.SeminarRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Commands.AddSeminarComment;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SeminarsServices.Commands
{
    public class AddSeminarCommentCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        ISeminarCommandRepository seminarCommandRepository,
        IHttpContextAccessor httpContextAccessor)
        : CommandHandler<AddSeminarComment, string>(mafiaOuterServices)
    {
        public override async Task<CommandResult<string>> Handle(AddSeminarComment command)
        {
            var userIdClaim = httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !long.TryParse(userIdClaim, out var userId))
                return await ResultAsync("User Is Not Defined.", ApplicationServiceStatus.NotFound);

            var seminar = await seminarCommandRepository.GetAsync(command.SeminarId);
            if (seminar == null)
                return await ResultAsync($"Seminar With Id : {command.SeminarId} Is Not Defined.", ApplicationServiceStatus.NotFound);

            seminar.AddComment(userId, new CommentContent(command.Content), command.Rating, command.Like, command.ParentId);
            await seminarCommandRepository.CommitAsync();
            return await OkAsync("Comment added successfully.");
        }
    }
}
