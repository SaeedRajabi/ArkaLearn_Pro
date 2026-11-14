using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs
{
    public class AuthenticateCode : BaseValueOBJs<AuthenticateCode>
    {
        #region Factories
        public static AuthenticateCode CreateNew(int validityInMinutes)
        {
            string code = GenerateCode();
            DateTime generatedAt = DateTime.UtcNow;
            DateTime expirationTime = generatedAt.AddMinutes(validityInMinutes);

            return new AuthenticateCode(code, generatedAt, expirationTime);
        }

        public static AuthenticateCode FromExisting(string code, DateTime generatedAt, DateTime expirationTime)
            => new AuthenticateCode(code, generatedAt, expirationTime);
        #endregion

        #region Properties
        public string Value { get; private set; }
        public DateTime GeneratedAt { get; private set; }
        public DateTime ExpirationTime { get; private set; }
        #endregion

        #region CTORs
        public AuthenticateCode(string value, DateTime generatedAt, DateTime expirationTime)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new InvalidValueObjectStateException("Authentication code cannot be empty.", nameof(AuthenticateCode));
            if (value.Length != 6 || !IsDigitsOnly(value))
                throw new InvalidValueObjectStateException("Authentication code must be a 6-digit number.", nameof(AuthenticateCode));
            if (expirationTime <= generatedAt)
                throw new InvalidValueObjectStateException("Expiration time must be later than the generated time.", nameof(AuthenticateCode));

            Value = value;
            GeneratedAt = generatedAt;
            ExpirationTime = expirationTime;
        }


        private AuthenticateCode() { }
        #endregion

        #region Class Methods Override 
        public override string ToString() => $"Code: {Value}, Generated At: {GeneratedAt}, Expiration Time: {ExpirationTime}";
        #endregion

        #region Override Methods In Parent Class
        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Value;
        }
        #endregion

        #region Behaviors IMP
        // Method to check if the code is still valid
        public bool IsValid()
        {
            return DateTime.UtcNow <= ExpirationTime;
        }


        // Method to verify the provided code matches the stored code
        public bool Verify(string code)
        {
            return Value == code && IsValid();
        }


        // Helper method to ensure the code contains only digits
        private static bool IsDigitsOnly(string str)
        {
            foreach (char c in str)
            {
                if (c < '0' || c > '9')
                    return false;
            }
            return true;
        }


        // Private method to generate a 6-digit authentication code
        private static string GenerateCode()
        {
            Random random = new Random();
            return random.Next(100000, 999999).ToString();
        }

        #endregion
    }
}
