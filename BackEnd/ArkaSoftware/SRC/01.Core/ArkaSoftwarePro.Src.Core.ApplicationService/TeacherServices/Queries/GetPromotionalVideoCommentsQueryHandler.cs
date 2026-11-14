using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherPromotionalVideos;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Queries;

public class GetPromotionalVideoCommentsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IPromotionalVideoRepository promotionalVideoRepository,
    IUserCommandRepository userCommandRepository)
    : QueryHandler<GetPromotionalVideoCommentsQuery, List<PromotionalVideoCommentQri>>(outer)
{
    public override async Task<QueryResult<List<PromotionalVideoCommentQri>>> Handle(GetPromotionalVideoCommentsQuery query)
    {
        try
        {
            var video = await promotionalVideoRepository.GetVideoWithTeacherAsync(query.VideoId);
            if (video == null || !PromotionalVideoPublicAccess.IsPubliclyVisible(video, video.Teacher))
                return await ResultAsync(new List<PromotionalVideoCommentQri>(), ApplicationServiceStatus.Ok);

            var comments = await promotionalVideoRepository.GetCommentsByVideoIdAsync(query.VideoId);
            var userIds = comments.Select(c => c.UserId).Distinct().ToList();
            var users = new Dictionary<long, PromotionalVideoCommentAuthorQri>();
            foreach (var userId in userIds)
            {
                var user = await userCommandRepository.GetAsync(userId);
                if (user == null) continue;
                var fullName = user.UserFullName != null
                    ? $"{user.UserFullName.FirstName} {user.UserFullName.LastName}".Trim()
                    : user.UserName?.Value ?? $"User {userId}";
                users[userId] = new PromotionalVideoCommentAuthorQri
                {
                    Id = userId,
                    FullName = fullName,
                    UserName = user.UserName?.Value,
                    AvatarUrl = user.ProfileImage?.ImageURL,
                };
            }

            var items = comments.Select(c => new PromotionalVideoCommentQri
            {
                Id = c.Id,
                VideoId = c.VideoId,
                Text = c.Content,
                ParentId = c.ParentId,
                TimeStamp = string.Empty,
                Author = users.GetValueOrDefault(c.UserId),
            }).ToList();

            var dict = items.ToDictionary(x => x.Id);
            var roots = new List<PromotionalVideoCommentQri>();
            foreach (var node in items)
            {
                if (node.ParentId is null)
                {
                    roots.Add(node);
                    continue;
                }

                if (dict.TryGetValue(node.ParentId.Value, out var parent))
                    parent.Replies.Add(node);
                else
                    roots.Add(node);
            }

            return await ResultAsync(roots.Where(r => !r.ParentId.HasValue).ToList(), ApplicationServiceStatus.Ok);
        }
        catch (Exception)
        {
            return await ResultAsync(null!, ApplicationServiceStatus.Exception);
        }
    }
}
