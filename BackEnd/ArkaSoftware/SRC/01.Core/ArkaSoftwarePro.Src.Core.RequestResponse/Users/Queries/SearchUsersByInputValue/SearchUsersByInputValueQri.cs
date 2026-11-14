using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Enumerations;
using Framework.Src.Utilities.OutService.DateTimes;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.SearchUsersByInputValue
{
    public class SearchUsersByInputValueQri
    {
        public long Id { get; set; }
        public string Name { get; set; } = string.Empty ;
        public string Email { get; set; } = string.Empty;
        public string AvatarUrl { get; set; } = string.Empty;
        public string Initials { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string RegistrationDate { get; set; } = string.Empty;
        public string LastLogin { get; set; } = DateTime.UtcNow.ToLongPersianDateString();
        public string Role { get; set; } = string.Empty;

    }
}
