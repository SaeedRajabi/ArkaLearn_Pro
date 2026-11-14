using Microsoft.AspNetCore.SignalR;

namespace ArkaSoftwarePro.Src.Endpoints.API.Hubs;

public class ProjectQaHub : Hub
{
    public static string ProjectGroup(long projectId) => $"project-{projectId}";

    public static string UserGroup(long userId) => $"user-{userId}";

    public const string AdminGroup = "admin-project-qa";

    public Task JoinProject(long projectId)
    {
        return Groups.AddToGroupAsync(Context.ConnectionId, ProjectGroup(projectId));
    }

    public Task LeaveProject(long projectId)
    {
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, ProjectGroup(projectId));
    }

    public Task JoinUser(long userId)
    {
        return Groups.AddToGroupAsync(Context.ConnectionId, UserGroup(userId));
    }

    public Task LeaveUser(long userId)
    {
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, UserGroup(userId));
    }

    public Task JoinAdmin()
    {
        return Groups.AddToGroupAsync(Context.ConnectionId, AdminGroup);
    }

    public Task LeaveAdmin()
    {
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, AdminGroup);
    }
}
