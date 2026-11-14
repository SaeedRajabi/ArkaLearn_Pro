using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Enumerations;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.AddUsers
{
    public class AddUser : ICommand<object>, IWebRequest
    {
        /// <summary>Unique login name (English).</summary>
        public string UserName { get; set; } = string.Empty;

        /// <summary>Display full name (first + last); stored in FirstName/LastName, not UserName.</summary>
        public string FullName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string Password { get; set; } = string.Empty;

        /// <summary>Iranian mobile, e.g. 09182767745 or 9182767745.</summary>
        public string PhoneNumber { get; set; } = string.Empty;

        public UserRole UserRole { get; set; }
        public bool AcceptedTerms { get; set; }
        public string? OtpSessionId { get; set; }
        public string? OtpCode { get; set; }
        public string Path => "/api/Service/User/Create";
    }
}
