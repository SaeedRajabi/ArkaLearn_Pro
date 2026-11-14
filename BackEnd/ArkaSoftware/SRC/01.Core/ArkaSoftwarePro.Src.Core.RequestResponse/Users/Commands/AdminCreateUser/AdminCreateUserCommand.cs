using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Enumerations;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.AdminCreateUser;

public class AdminCreateUserCommand : ICommand<AdminCreateUserResult>, IWebRequest
{
    public string UserName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public UserRole UserRole { get; set; }
    public bool AcceptedTerms { get; set; } = true;
    public string Path => "/api/Service/AdminUserManagement/AdminCreate";
}

public class AdminCreateUserResult
{
    public long UserId { get; set; }
    public long? StudentId { get; set; }
    public long? TeacherId { get; set; }
}
