using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs;
using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities
{
    public class RoomUser : Entity
    {
        public FullName? Name { get; private set; }
        public UserName? UserName { get; private set; }
        public Password? Password { get; private set; }
        public bool IsOnline { get; private set; }

        /// <summary>When true, this seat cannot log into the live room or join SignalR.</summary>
        public bool IsBlocked { get; private set; }
        public long RoomId { get; private set; }
        public Room? Room { get; private set; }

        /// <summary>Optional login alias (email). Stored normalized (trimmed).</summary>
        public string? Email { get; private set; }

        public string? PhotoUrl { get; private set; }

        public long? ManagedRoomStudentId { get; private set; }

        private RoomUser(string firstName , string lastName , string userName ,string password , long roomId)
        {
            Name = FullName.Create(firstName , lastName);
            UserName = new UserName(userName);
            Password = Password.Create(password);
            RoomId = roomId;
            IsOnline = false;
            IsBlocked = false;
        }

        public RoomUser()
        {
            
        }

        public static RoomUser Create(string firstName, string lastName, string userName, string password , long roomId)
            => new RoomUser(firstName, lastName, userName, password , roomId);

        /// <summary>Room user row synced from <see cref="ManagedRoomStudent"/> (same password hash).</summary>
        public static RoomUser CreateFromManagedStudent(ManagedRoomStudent managed, long roomId, string? photoFallback)
        {
            var pwd = Password.FromStored(managed.Password.HashedPassword, managed.Password.Salt);
            var photo = !string.IsNullOrWhiteSpace(managed.PhotoUrl)
                ? managed.PhotoUrl
                : photoFallback;
            return new RoomUser
            {
                Name = FullName.Create(managed.FirstName, managed.LastName),
                UserName = managed.UserName,
                Password = pwd,
                RoomId = roomId,
                IsOnline = false,
                Email = managed.Email,
                ManagedRoomStudentId = managed.Id,
                PhotoUrl = string.IsNullOrWhiteSpace(photo) ? null : photo.Trim(),
                IsBlocked = false,
            };
        }

        public void SetBlocked(bool blocked) => IsBlocked = blocked;

        /// <summary>
        /// Links an existing room seat to a catalog student and copies login credentials (hash + salt).
        /// </summary>
        public void SyncFromManagedStudent(ManagedRoomStudent managed, string? photoFallback)
        {
            ManagedRoomStudentId = managed.Id;
            Name = FullName.Create(managed.FirstName, managed.LastName);
            UserName = managed.UserName;
            Email = string.IsNullOrWhiteSpace(managed.Email) ? Email : managed.Email.Trim();
            Password = Password.FromStored(managed.Password.HashedPassword, managed.Password.Salt);
            var photo = !string.IsNullOrWhiteSpace(managed.PhotoUrl)
                ? managed.PhotoUrl
                : photoFallback;
            if (!string.IsNullOrWhiteSpace(photo))
                PhotoUrl = photo.Trim();
        }

        public void UpdateUserStatus(bool userStatus)
        {
            IsOnline = userStatus;
        }
        public bool VerifyPassword(string plainPassword)
        {
            if (Password is null || !Password.Verify(plainPassword)) return false;
            if (Password.NeedsRehash) Password = Password.Create(plainPassword);
            return true;
        }
        public bool IsRoomUserOnline()
        {
            return IsOnline;
        }
        
    }
}
