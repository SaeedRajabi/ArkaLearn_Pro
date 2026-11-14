using ArkaSoftwarePro.Src.Core.Contracts.Articles.ArticleRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Commands.DeleteArticleComment;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ArticlesServices.Commands
{
    public class DeleteArticleCommentCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        IArticleCommandRepository articleCommandRepository)
        : CommandHandler<DeleteArticleCommentCommand, string>(mafiaOuterServices)
    {
        public override async Task<CommandResult<string>> Handle(DeleteArticleCommentCommand command)
        {
            var deleted = await articleCommandRepository.DeleteCommentAsync(command.ArticleId, command.CommentId);
            if (!deleted)
                return await ResultAsync("Article comment was not found.", ApplicationServiceStatus.NotFound);

            await articleCommandRepository.CommitAsync();
            return await OkAsync("Article comment deleted successfully.");
        }
    }
}
