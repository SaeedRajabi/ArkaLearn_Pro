using ArkaSoftwarePro.Src.Core.Contracts.Seminars.SeminarRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Commands.ApproveSeminarComment;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SeminarsServices.Commands
{
    public class ApproveSeminarCommentCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        ISeminarCommandRepository seminarCommandRepository)
        : CommandHandler<ApproveSeminarCommentCommand, string>(mafiaOuterServices)
    {
        public override async Task<CommandResult<string>> Handle(ApproveSeminarCommentCommand command)
        {
            var seminar = await seminarCommandRepository.GetAsync(command.SeminarId);
            if (seminar == null)
                return await ResultAsync($"Seminar With Id : {command.SeminarId} Is Not Defined.", ApplicationServiceStatus.NotFound);

            seminar.ApproveComment(command.CommentId, command.IsApproved);
            await seminarCommandRepository.CommitAsync();
            return await OkAsync("Comment approval updated.");
        }
    }
}
