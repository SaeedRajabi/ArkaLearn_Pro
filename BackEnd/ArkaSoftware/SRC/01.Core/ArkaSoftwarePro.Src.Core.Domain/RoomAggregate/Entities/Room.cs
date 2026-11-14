using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Events;
using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Events;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs;
using Framework.Src.Core.Domain.Aggregates;
using Framework.Src.Core.Domain.Exceptions;

namespace ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities
{
    public class Room:AggregateRoot
    {
        public RoomTitle? Title { get; private set; }
        /// <summary>URL segment for room entry (e.g. my-class → /room/my-class)</summary>
        public string? Slug { get; private set; }
        public int Capacity { get; private set; }
        public RoomLink? ClassRoomLink { get; private set; }
        public string? RoomCode { get; private set; }
        public bool IsGuest { get; private set; }
        public int GuestQuantity { get; private set; }
        public bool FirstAdminInput { get; private set; }
        /// <summary>When true, students wait until a host/teacher joins before entering the live session.</summary>
        public bool TeacherEntersFirst { get; private set; }
        public StatusType Status { get; private set; }
        public int MaxSessionTime { get; private set; }
        public long? DefaultMediaFileId { get; private set; }
        public long? DefaultSlideFileId { get; private set; }


        public long UserId { get; private set; }
        public User? User { get; private set; }

        public IReadOnlyList<RoomUser> RoomUsers => _roomUsers;
        private readonly List<RoomUser> _roomUsers = new List<RoomUser>();

        public IReadOnlyList<RoomFile> RoomFiles => _roomFiles;
        private readonly List<RoomFile> _roomFiles = new List<RoomFile>();

        public IReadOnlyList<Chat> Chats => _chats;
        private readonly List<Chat> _chats = new List<Chat>();

        private Room() { } // For EF Core

        public Room(
            string title , int capacity , string baseUrl , string slug ,
            bool isGuest , int guestQuantity , bool firstAdminInput, bool teacherEntersFirst,
            int maxSessionTime , StatusType status , long userId)
        {
            Title = RoomTitle.Create(title);
            Slug = string.IsNullOrWhiteSpace(slug) ? null : slug.Trim().ToLowerInvariant();
            Capacity = capacity;
            RoomCode = Guid.NewGuid().ToString("N").Substring(0, 8);
            ClassRoomLink = RoomLink.Create(baseUrl , Slug ?? Title!.Value);
            IsGuest = isGuest;
            MaxSessionTime = maxSessionTime;
            GuestQuantity = guestQuantity;
            FirstAdminInput = firstAdminInput;
            TeacherEntersFirst = teacherEntersFirst;
            Status = status;
            UserId = userId;
            AddEvent(new RoomAdded(title, capacity , baseUrl , isGuest , guestQuantity , firstAdminInput , teacherEntersFirst, maxSessionTime , userId , status));
        }

        public void Update(string? title, int? capacity, string? slug, string? baseUrl, bool? isGuest, int? guestQuantity, StatusType? status, int? maxSessionTime, long? defaultMediaFileId, long? defaultSlideFileId, bool? teacherEntersFirst)
        {
            if (!string.IsNullOrWhiteSpace(title))
                Title = RoomTitle.Create(title);
            if (capacity.HasValue)
                Capacity = capacity.Value;
            if (!string.IsNullOrWhiteSpace(slug))
                Slug = slug.Trim().ToLowerInvariant();
            if (!string.IsNullOrWhiteSpace(baseUrl) && Slug != null)
                ClassRoomLink = RoomLink.Create(baseUrl, Slug);
            if (isGuest.HasValue)
                IsGuest = isGuest.Value;
            if (guestQuantity.HasValue)
                GuestQuantity = guestQuantity.Value;
            if (status.HasValue)
                Status = status.Value;
            if (maxSessionTime.HasValue)
                MaxSessionTime = maxSessionTime.Value;
            if (defaultMediaFileId.HasValue)
                DefaultMediaFileId = defaultMediaFileId.Value;
            else
                DefaultMediaFileId = null;
            if (defaultSlideFileId.HasValue)
                DefaultSlideFileId = defaultSlideFileId.Value;
            else
                DefaultSlideFileId = null;
            if (teacherEntersFirst.HasValue)
                TeacherEntersFirst = teacherEntersFirst.Value;
        }
        public void AddUserRoom(string firstName , string lastName , string userName , string password)
        {
            var roomUser = RoomUser.Create(firstName , lastName , userName , password , Id);
            _roomUsers.Add(roomUser);
            AddEvent(new UserRoomAdded(firstName, lastName, userName, string.Empty, Id));
        }

        public void AddRoomUserFromManagedStudent(ManagedRoomStudent managed, string? defaultAvatarUrl)
        {
            AssignOrSyncManagedStudentSeat(managed, defaultAvatarUrl);
        }

        /// <summary>
        /// Adds a new seat from the catalog or links/syncs an existing seat (e.g. created at seminar registration with a random password).
        /// </summary>
        public void AssignOrSyncManagedStudentSeat(ManagedRoomStudent managed, string? defaultAvatarUrl)
        {
            var linked = _roomUsers.FirstOrDefault(ru =>
                !ru.IsDelete && ru.ManagedRoomStudentId == managed.Id);

            if (linked != null)
            {
                linked.SyncFromManagedStudent(managed, defaultAvatarUrl);
                return;
            }

            var existing = FindRoomUserForLogin(managed.UserName.Value);
            if (existing == null && !string.IsNullOrWhiteSpace(managed.Email))
                existing = FindRoomUserForLogin(managed.Email);

            if (existing != null)
            {
                if (existing.ManagedRoomStudentId.HasValue && existing.ManagedRoomStudentId != managed.Id)
                    throw new InvalidEntityStateException(
                        "This username or email is already linked to another catalog student in the room.",
                        nameof(managed));

                existing.SyncFromManagedStudent(managed, defaultAvatarUrl);
                AddEvent(new UserRoomAdded(managed.FirstName, managed.LastName, managed.UserName.Value, string.Empty, Id));
                return;
            }

            if (_roomUsers.Any(r =>
                    !r.IsDelete &&
                    r.UserName != null &&
                    string.Equals(r.UserName.Value, managed.UserName.Value, StringComparison.OrdinalIgnoreCase)))
                throw new InvalidEntityStateException("This username is already registered in the room.", nameof(managed));

            var ru = RoomUser.CreateFromManagedStudent(managed, Id, defaultAvatarUrl);
            _roomUsers.Add(ru);
            AddEvent(new UserRoomAdded(managed.FirstName, managed.LastName, managed.UserName.Value, string.Empty, Id));
        }

        /// <summary>Removes room seats linked to catalog students whose ids are not in <paramref name="keepManagedStudentIds"/>.</summary>
        public void RemoveManagedRoomUsersNotIn(IReadOnlySet<long> keepManagedStudentIds)
        {
            var toRemove = _roomUsers
                .Where(ru => ru.ManagedRoomStudentId != null && !keepManagedStudentIds.Contains(ru.ManagedRoomStudentId.Value))
                .ToList();
            foreach (var ru in toRemove)
                _roomUsers.Remove(ru);
        }

        /// <summary>Finds an assigned seat in this room by username or email (trimmed).</summary>
        public RoomUser? FindRoomUserForLogin(string userNameOrEmail)
        {
            var key = (userNameOrEmail ?? string.Empty).Trim();
            if (string.IsNullOrEmpty(key))
                return null;

            foreach (var item in _roomUsers.Where(u => !u.IsDelete))
            {
                if (item.UserName != null &&
                    string.Equals(item.UserName.Value, key, StringComparison.OrdinalIgnoreCase))
                    return item;
                if (!string.IsNullOrEmpty(item.Email) &&
                    string.Equals(item.Email.Trim(), key, StringComparison.OrdinalIgnoreCase))
                    return item;
            }

            return null;
        }

        public void LoginIntoRoom(string userNameOrEmail, string password)
        {
            var key = (userNameOrEmail ?? string.Empty).Trim();
            if (string.IsNullOrEmpty(key) || string.IsNullOrEmpty(password))
                throw new InvalidEntityStateException("Room login: username/email and password are required.", nameof(userNameOrEmail));

            var seat = FindRoomUserForLogin(key);
            if (seat == null)
                throw new InvalidEntityStateException("Room login: this account is not registered for this room.", nameof(userNameOrEmail));

            if (seat.IsBlocked)
                throw new InvalidEntityStateException("Room login: this seat is blocked and cannot enter this room.", nameof(userNameOrEmail));

            if (!seat.VerifyPassword(password))
                throw new InvalidEntityStateException("Room login: invalid username/email or password.", nameof(userNameOrEmail));

            AddEvent(new LoginIntoRoom(key, string.Empty));
        }

        /// <summary>Moderator/host blocks or unblocks a participant seat.</summary>
        public void SetRoomSeatBlocked(long roomUserId, bool blocked)
        {
            var ru = _roomUsers.FirstOrDefault(x => x.Id == roomUserId);
            if (ru == null)
                throw new InvalidEntityStateException("Room seat was not found in this room.", nameof(roomUserId));
            ru.SetBlocked(blocked);
        }


        public void SendMessage(string message) 
        { 
            Chat chat = Chat.Create(message , Id);
            _chats.Add(chat);
            AddEvent(new MessageSended(message, Id));
        }

        public void UpdateRoomUserStatus(long roomUserId, bool status)
        {
            var result = _roomUsers.FirstOrDefault(x => x.Id == roomUserId);
            if (result! == null!)
                throw new InvalidEntityStateException($"User With Id : {roomUserId} Is Not Defined", nameof(UpdateRoomUserStatus));
            result.UpdateUserStatus(status);
            AddEvent(new RoomUserStatusUpdated(roomUserId , status));
        }

        public void RemoveRoomSeat(long roomUserId)
        {
            var seat = _roomUsers.FirstOrDefault(x => x.Id == roomUserId);
            if (seat == null)
                throw new InvalidEntityStateException("Room seat was not found in this room.", nameof(roomUserId));
            _roomUsers.Remove(seat);
        }

        public bool IsUserOnlineInRoom(long roomUserId)
        {
            var result = _roomUsers.FirstOrDefault(x => x.Id == roomUserId);
            if (result! == null!)
                throw new InvalidEntityStateException("User Not Found", nameof(IsUserOnlineInRoom));
            return result.IsRoomUserOnline();
        }

        public void AddRoomFile(
            RoomFileType fileType,
            string title,
            string? description,
            string fileName,
            string fileUrl,
            long fileSize,
            string? uploadedByUserId = null)
        {
            var file = RoomFile.Create(Id, fileType, title, description, fileName, fileUrl, fileSize, uploadedByUserId);
            _roomFiles.Add(file);
        }

        public RoomFile RemoveRoomFile(long fileId)
        {
            var file = _roomFiles.FirstOrDefault(x => x.Id == fileId);
            if (file == null)
                throw new InvalidEntityStateException("Room file was not found in this room.", nameof(fileId));

            if (DefaultMediaFileId == fileId)
                DefaultMediaFileId = null;
            if (DefaultSlideFileId == fileId)
                DefaultSlideFileId = null;

            _roomFiles.Remove(file);
            return file;
        }
    }
}
