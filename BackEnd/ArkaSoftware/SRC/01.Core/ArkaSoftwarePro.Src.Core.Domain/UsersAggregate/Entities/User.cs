using Framework.Src.Core.Domain.Aggregates;
using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.Domain.ValueOBJs;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Events;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.Domain.StudentAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities
{
    public class User : AggregateRoot
    {
        #region Properties
        public UserName UserName { get; private set; }
        public Password PasswordHash { get; private set; }
        public Email Email { get; private set; }
        public UserRole Role { get; private set; }
        public bool EmailVerified { get; private set; }
        public FullName? UserFullName { get; private set; }
        public Image? ProfileImage { get; private set; }
        public PhoneNumber? PhoneNumber { get; private set; }
        public bool PhoneNumberVerified { get; private set; }
        public DateTime? DateOfBirth { get; private set; }
        public DateTime? LastLoginDateTime { get; private set; }
        public UserStatus Status { get; private set; }
        public bool TwoFactorEnabled { get; private set; }
        public bool TwoFactorSecret { get; private set; }
        public int LoginAttemptCount { get; private set; }
        public bool AcceptedTerms { get; private set; }
        #endregion

        #region Properties Factories
        public string EmailValue => Email.Value;
        public string UserNameValue => UserName.Value;

        #endregion

        #region References Properties
        //public Student Student { get; private set; }
        public Teacher Teacher { get; private set; }


        public IReadOnlyList<AuthenticationToken> AuthenticationTokens => _authenticationTokens;
        private readonly List<AuthenticationToken> _authenticationTokens = new List<AuthenticationToken>();
        public IReadOnlyList<UserSession> UserSessions => _userSessions;
        private readonly List<UserSession> _userSessions = new List<UserSession>();
        public IReadOnlyList<AuditLog> AuditLogs => _auditLogs;
        private readonly List<AuditLog> _auditLogs = new List<AuditLog>();

        public IReadOnlyList<Room> Rooms => _rooms;
        private readonly List<Room> _rooms = new List<Room>();
        public IReadOnlyList<UserClaim> UserClaims => _userClaims;
        private readonly List<UserClaim> _userClaims = new List<UserClaim>();
        public IReadOnlyList<TwoFactorCode> TwoFactorCodes => _twoFactorCodes;
        private readonly List<TwoFactorCode> _twoFactorCodes = new List<TwoFactorCode>();


        #endregion

        #region CTORs
        public User(PId userId, UserName userName, Password password, Email email, UserRole role, bool acceptedTerms)
        {
            Id = userId.Value;
            UserName = userName;
            PasswordHash = password;
            Email = email;
            AcceptedTerms = acceptedTerms;
            EmailVerified = false;
            LastLoginDateTime = DateTime.UtcNow;
            PhoneNumberVerified = false;
            LoginAttemptCount = 1;
            TwoFactorEnabled = false;
            Role = role;
            Status = UserStatus.ACTIVE;
            // Note: UserAdded event expects plain password, but we don't have it here. 
            // We can pass null or empty string for password in the event.
            AddEvent(new UserAdded(userName.Value, "", email.Value, role, acceptedTerms));
        }

        public User(PId userId,FullName userFullName, UserName userName, string password, Email email, UserRole role , bool acceptedTerms)
        {
            Id = userId.Value;
            UserFullName = userFullName;
            UserName = userName;
            PasswordHash = Password.Create(password);
            Email = email;
            AcceptedTerms = acceptedTerms;
            EmailVerified = false;
            LastLoginDateTime = DateTime.UtcNow;
            PhoneNumberVerified = false;
            LoginAttemptCount = 1;
            TwoFactorEnabled = false;
            Role = role;
            Status = UserStatus.ACTIVE;
            AddEvent(new UserAdded(userName.Value, string.Empty, email.Value, role , acceptedTerms));
        }
        public User(PId userId, UserName userName, string password, Email email, UserRole role, bool acceptedTerms)
        {
            Id = userId.Value;
            UserName = userName;
            PasswordHash = Password.Create(password);
            Email = email;
            AcceptedTerms = acceptedTerms;
            EmailVerified = false;
            LastLoginDateTime = DateTime.UtcNow;
            PhoneNumberVerified = false;
            LoginAttemptCount = 1;
            TwoFactorEnabled = false;
            Role = role;
            Status = UserStatus.ACTIVE;
            AddEvent(new UserAdded(userName.Value, string.Empty, email.Value, role, acceptedTerms));
        }
        private User() { }
        #endregion

        #region Hellpers Method

        private bool IsEmail(string identifier)
        {
            return identifier.Contains("@");
        }

        private bool IsUsername(string identifier)
        {
            return !string.IsNullOrEmpty(identifier) && !IsEmail(identifier) && !IsPhoneNumber(identifier);
        }

        private bool IsPhoneNumber(string identifier)
        {
            return long.TryParse(identifier, out _);
        }

        #endregion

        #region User Behaviors IMP

        public void UpdateUserFullName(string firstName , string lastName)
        {
            UserFullName = FullName.Create(firstName, lastName);
            AddEvent(new UserFullNameUpdated(Id ,firstName, lastName));
        }

        public void SetPhoneNumber(string countryCode, string localNumber)
        {
            PhoneNumber = PhoneNumber.Create(countryCode, localNumber);
        }

        public void ChangeEmail(Email newEmail)
        {
            Email = newEmail;
            EmailVerified = false;
        }

        public void ChangeProfileImage(string profileImageUrl)
        {
            ProfileImage = Image.Create(profileImageUrl);
            AddEvent(new UserProfileUpdated(Id, UserNameValue, EmailValue, profileImageUrl, DateTime.UtcNow));
        }

        public UserSession AddSession(DateTime expireAt, string IpAddress = " ", string DeviceInfo = " ")
        {
            UserSession session = UserSession.Create(Id, expireAt);
            _userSessions.Add(session);
            AddEvent(new UserSessionAdded(Id, expireAt, IpAddress, DeviceInfo));
            return session;
        }
        public void RemoveSessions()
        {
            if (_userSessions.Count == 0)
                throw new InvalidEntityStateException("User Sessions Is Empty.", nameof(UserSession));
            _userSessions.Clear();
            AddEvent(new UserSessionRemoved());
        }
        public void CreateUserActionLog(ActionType action, DateTime time, string iPAddress, string deviceInfo)
        {
            AuditLog log = AuditLog.CreateLog(Id, action, time, iPAddress, deviceInfo);
            _auditLogs.Add(log);
            AddEvent(new AuditLogCreated(Id, action, time, iPAddress, deviceInfo));
        }
        public void EnableTwoFactorAuthentication()
        {
            TwoFactorEnabled = true;
        }
        public void DisableTwoFactorAuthentication()
        {
            TwoFactorEnabled = false;

        }
        public bool VerifyPassword(string plainPassword)
        {
            if (!PasswordHash.Verify(plainPassword)) return false;
            if (PasswordHash.NeedsRehash) PasswordHash = Password.Create(plainPassword);
            return true;
        }
        public int UserSessionsQuantity()
        {
            return _userSessions.Count();
        }
        public void LoginAttemptIncrement()
        {
            LoginAttemptCount++;
        }
        public void AddAuthenticationToken(AuthenticationToken token)
        {
            _authenticationTokens.Add(token);
            AddEvent(new AuthenticationTokenAdded(Id, token.Token!.Value, token.ExpirationDate, token.IssuedAt, token.IsRevoked));
        }
        public void Login(UserName username, string password)
        {
            var result = VerifyPassword(password);
            if (UserName != username || !result)
                throw new InvalidEntityStateException("UserName OR Password Is Not Valid.", nameof(username));
            AddEvent(new UserLogin(username.Value, string.Empty));
        }
        public void AddClaim(ClaimVT claimType, ClaimVT claimValue)
        {
            UserClaim claim = new(Id, claimType, claimValue);
            bool exist = _userClaims.Any(x => x.ClaimType.Value == claim.ClaimType.Value);
            if (exist)
                return;
            _userClaims.Add(claim);
            AddEvent(new UserClaimAdded(Id, claimType.Value, claimValue.Value));
        }
        public void AddIPInBlackList(string IPAddress, string UserInfo, string Description)
        {

        }
        public bool ValidateSession(string ipAddress, string deviceInfo)
        {
            var session = _userSessions.FirstOrDefault(s => s.IsValid());
            if (session! == null!)
                throw new InvalidEntityStateException("Session is invalid or expired", nameof(session));
            return true;
        }
        public UserSession? GetCurrentSession()
        {
            var sessionCurrent = _userSessions.OrderByDescending(s => s.ExpirationTime)
                            .FirstOrDefault(s => s.ExpirationTime > DateTime.UtcNow);
            return sessionCurrent;
        }
        public void Logout()
        {
            foreach (var session in _userSessions)
            {
                session.ExpireSession();
                session.Deactivate();
            }
            foreach (var token in _authenticationTokens)
            {
                token.Revoke();
            }
            _userClaims.Clear();
            AddEvent(new UserLoggedOut(Id, DateTime.Now));
        }
        #endregion


        public void VerifyEmail(string verificationCode)
        {
            MarkEmailVerified();
        }

        public void MarkEmailVerified()
        {
            if (EmailVerified)
                return;

            EmailVerified = true;
            AddEvent(new EmailVerified(Id, Email.Value));
        }

        public void VerifyPhoneNumber()
        {
            PhoneNumberVerified = true;
        }
        public void UpdateProfile() { }
        public void ChangePassword(string currentPassword, string newPassword)
        {
            if (!PasswordHash.Verify(currentPassword))
                throw new InvalidOperationException("Current password is incorrect");

            PasswordHash = Password.Create(newPassword);
            //AddEvent(new PasswordChanged(Id));
        }

        public void ResetPasswordByAdmin(string newPassword)
        {
            PasswordHash = Password.Create(newPassword);
        }

        public void ResetPassword(string newPassword)
        {
            PasswordHash = Password.Create(newPassword);
        }

        public void AssignRole() { }

        public void SetBlocked(bool blocked)
        {
            Status = blocked ? UserStatus.BLOCKED : UserStatus.ACTIVE;
        }

        public bool IsBlocked() => Status == UserStatus.BLOCKED;

        public void Deactivate() { }
    }
}
