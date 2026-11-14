using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Utilities.OutService.Services;
using Framework.Src.Core.RequestResponse.Common;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.LikeCourseComments;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using System;
using System.Threading.Tasks;
using System.Linq;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Commands
{
    public class LikeCourseCommentCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        ICourseCommandRepository courseCommandRepository,
        IHttpContextAccessor httpContextAccessor)
        : CommandHandler<LikeCourseComment, string>(mafiaOuterServices)
    {
        public override async Task<CommandResult<string>> Handle(LikeCourseComment command)
        {
            var course = await courseCommandRepository.GetAsync(command.CourseId);
            if (course == null)
                return await ResultAsync($"Course With Id : {command.CourseId} Is Not Defined.", ApplicationServiceStatus.NotFound);

            var comment = course.CourseComments.FirstOrDefault(x => x.Id == command.CommentId);
            if (comment == null)
                return await ResultAsync($"Comment With Id : {command.CommentId} Is Not Defined in this Course.", ApplicationServiceStatus.NotFound);

            comment.CommentLike();
            
            await courseCommandRepository.CommitAsync();
            return await OkAsync("Comment Liked Successfully.");
        }
    }
}