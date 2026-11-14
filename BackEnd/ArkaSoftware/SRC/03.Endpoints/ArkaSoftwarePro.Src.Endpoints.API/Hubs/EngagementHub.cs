using Microsoft.AspNetCore.SignalR;

namespace ArkaSoftwarePro.Src.Endpoints.API.Hubs;

public class EngagementHub : Hub
{
    public static string UserGroup(long userId) => $"user-{userId}";

    public static string CourseGroup(long courseId) => $"course-{courseId}";

    public static string ArticleGroup(long articleId) => $"article-{articleId}";

    public static string VideoGroup(long videoId) => $"video-{videoId}";

    public Task JoinUser(long userId) =>
        Groups.AddToGroupAsync(Context.ConnectionId, UserGroup(userId));

    public Task LeaveUser(long userId) =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, UserGroup(userId));

    public Task JoinCourse(long courseId) =>
        Groups.AddToGroupAsync(Context.ConnectionId, CourseGroup(courseId));

    public Task LeaveCourse(long courseId) =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, CourseGroup(courseId));

    public Task JoinArticle(long articleId) =>
        Groups.AddToGroupAsync(Context.ConnectionId, ArticleGroup(articleId));

    public Task LeaveArticle(long articleId) =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, ArticleGroup(articleId));

    public Task JoinVideo(long videoId) =>
        Groups.AddToGroupAsync(Context.ConnectionId, VideoGroup(videoId));

    public Task LeaveVideo(long videoId) =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, VideoGroup(videoId));
}
