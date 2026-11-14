using System;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.ApplicationService.EngagementServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.AddCourseComments;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Commands
{
    public class AddCourseCommentCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        ICourseCommandRepository courseCommandRepository,
        ITeacherQueryRepository teacherQueryRepository,
        EngagementNotifier engagementNotifier,
        UserEmailVerificationGuard emailVerificationGuard,
        IHttpContextAccessor httpContextAccessor)
        : CommandHandler<AddCourseComment, string>(mafiaOuterServices)
    {
        public override async Task<CommandResult<string>> Handle(AddCourseComment command)
        {
            try
            {
                var userIdClaim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x => 
                    x.Type == ClaimTypes.NameIdentifier || 
                    x.Type == "userId" ||
                    x.Type == "nameid");
                
                if (userIdClaim == null || string.IsNullOrEmpty(userIdClaim.Value))
                {
                    var allClaims = httpContextAccessor.HttpContext?.User?.Claims?.Select(c => $"{c.Type}={c.Value}").ToList() ?? new List<string>();
                    return await ResultAsync($"User Is Not Defined. Available claims: {string.Join(", ", allClaims)}", ApplicationServiceStatus.NotFound);
                }
                var userId = long.Parse(userIdClaim.Value);

                var emailCheck = await emailVerificationGuard.EnsureVerifiedAsync(userId);
                if (!emailCheck.Ok)
                {
                    AddMessage(emailCheck.Message);
                    return await ResultAsync(emailCheck.Message, ApplicationServiceStatus.ValidationError);
                }

                var parentId = command.ParentId > 0 ? command.ParentId : (long?)null;
                
                var courseExist = await courseCommandRepository.GetCourseWithCommentsAsync(command.CourseId);
                if (courseExist == null!)
                    return await ResultAsync($"Course With Id : {command.CourseId} Is Not Defined.", ApplicationServiceStatus.NotFound);

                var teacherId = await teacherQueryRepository.GetTeacherIdByUserIdAsync(userId);
                var isCourseTeacher = teacherId.HasValue && courseExist.TeacherId == teacherId.Value;

                var newComment = courseExist.AddCourseComment(
                    userId,
                    new CommentContent(command.Content),
                    command.Rating,
                    command.Like,
                    parentId);

                if (isCourseTeacher && parentId.HasValue)
                    newComment.ChangeApproved(true);

                await courseCommandRepository.CommitAsync();

                var displayName = httpContextAccessor.HttpContext?.User?.Identity?.Name
                    ?? httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Name)?.Value
                    ?? $"User {userId}";

                var courseTitle = courseExist.Title?.Value ?? "Course";

                if (isCourseTeacher && parentId.HasValue)
                {
                    var parentComment = courseExist.CourseComments.FirstOrDefault(c => c.Id == parentId.Value);
                    if (parentComment?.UserId is > 0 && parentComment.UserId.Value != userId)
                    {
                        await engagementNotifier.NotifyCourseReviewRepliedAsync(
                            courseExist.Id,
                            parentComment.UserId.Value,
                            courseTitle,
                            displayName,
                            newComment.Id,
                            parentId.Value);
                    }
                    else
                    {
                        await engagementNotifier.NotifyCourseCommentLiveAsync(
                            courseExist.Id,
                            newComment.Id,
                            parentId,
                            []);
                    }
                }
                else if (!parentId.HasValue)
                {
                    await engagementNotifier.NotifyCourseReviewSubmittedAsync(
                        courseExist,
                        newComment.Id,
                        displayName);
                }
                else
                {
                    await engagementNotifier.NotifyCourseCommentLiveAsync(
                        courseExist.Id,
                        newComment.Id,
                        parentId,
                        []);
                }

                return await OkAsync("Comment Added Success.");
            }
            catch (Exception ex)
            {
                return await ResultAsync($"Error adding comment: {ex.Message}. StackTrace: {ex.StackTrace}", ApplicationServiceStatus.Exception);
            }
        }
    }
}


