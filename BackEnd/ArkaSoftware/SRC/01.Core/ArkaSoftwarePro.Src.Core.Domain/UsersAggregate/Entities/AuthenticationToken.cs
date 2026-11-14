using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs;
using Framework.Src.Core.Domain.Entities;
using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities
{
    public class AuthenticationToken : Entity
    {
        #region Properties

        public long UserId { get; private set; }
        public Token? Token { get; private set; }
        public DateTime ExpirationDate { get; private set; }
        public DateTime? IssuedAt { get; private set; }
        public bool IsRevoked { get; private set; }

        #endregion

        #region CTORs
        public AuthenticationToken(PId userId, Token? token, DateTime expirationDate, DateTime? issuedAt, bool isRevoked)
        {
            UserId = userId.Value;
            Token = token;
            ExpirationDate = expirationDate;
            IssuedAt = issuedAt;
            IsRevoked = isRevoked;
        }

        private AuthenticationToken() { }

        #endregion

        #region Behaviors IMP   
        public void ExtendExpirationDate(int daysToAdd)
        {
            ExpirationDate = ExpirationDate.AddDays(daysToAdd);
        }
        public void Revoke()
        {
            IsRevoked = true;

        }
        public bool IsValid()
        {
            return !IsRevoked && ExpirationDate > DateTime.Now;
        }
        #endregion

    }
}
