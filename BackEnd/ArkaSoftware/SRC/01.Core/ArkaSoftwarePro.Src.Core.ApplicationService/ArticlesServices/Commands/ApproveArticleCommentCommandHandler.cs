using ArkaSoftwarePro.Src.Core.Contracts.Articles.ArticleRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Commands.ApproveArticleComment;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ArticlesServices.Commands
{
    public class ApproveArticleCommentCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        IArticleCommandRepository articleCommandRepository)
        : CommandHandler<ApproveArticleCommentCommand, string>(mafiaOuterServices)
    {
        public override async Task<CommandResult<string>> Handle(ApproveArticleCommentCommand command)
        {
            var article = await articleCommandRepository.GetWithCommentsAsync(command.ArticleId);
            if (article == null)
                return await ResultAsync($"Article With Id : {command.ArticleId} Is Not Defined.", ApplicationServiceStatus.NotFound);

            article.ApproveComment(command.CommentId, command.IsApproved);
            await articleCommandRepository.CommitAsync();
            return await OkAsync("Comment approval updated.");
        }
    }
}
