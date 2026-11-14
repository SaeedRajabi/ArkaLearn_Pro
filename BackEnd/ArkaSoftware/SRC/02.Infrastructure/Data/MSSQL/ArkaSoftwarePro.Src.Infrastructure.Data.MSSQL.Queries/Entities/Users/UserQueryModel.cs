using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Enumerations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Rooms;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Students;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Teachers;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Users
{
    public class UserQueryModel
    {
        public long Id { get; set; }
        public Guid BusinessId { get; set; }
        public string? UserName { get; set; }
        public string? Email { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? ProfileImage { get; set; }
        public string? PhoneNumber { get; set; }
        public string? PhoneCountryCode { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public DateTime CreateAt { get; set; }
        public bool EmailVerified { get; set; }
        public bool PhoneNumberVerified { get; set; }
        public bool TwoFactorEnable { get; set; }
        public string? Status { get; set; }
        public UserRole? Role { get; set; }


        public List<RoomQueryModel> Rooms { get; set; } = new List<RoomQueryModel>();

        public StudentQueryModel? Student { get; set; }

        public TeacherQueryModel? Teacher { get; set; }
    }
}
