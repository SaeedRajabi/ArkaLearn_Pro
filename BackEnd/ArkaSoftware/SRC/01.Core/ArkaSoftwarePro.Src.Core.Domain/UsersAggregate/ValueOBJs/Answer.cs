using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.Domain.ValueOBJs;
using System.Security.Cryptography;
using System.Text;

namespace ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs
{
    public class Answer : BaseValueOBJs<Answer>
    {
        #region Factories
        public static Answer FromPlainText(string answer)
        {
            if (string.IsNullOrEmpty(answer))
                throw new InvalidValueObjectStateException(nameof(answer));
            string hashValue = HasAnswer(answer);
            return new Answer(hashValue);
        }

        public static Answer FromHash(string hashValue) => new Answer(hashValue);
        #endregion

        #region Properties
        public string Value { get; private set; }
        #endregion

        #region CTORs
        public Answer(string hashValue)
        {
            if (string.IsNullOrWhiteSpace(hashValue))
                throw new InvalidValueObjectStateException("Hash value cannot be empty.", nameof(Answer));
            Value = hashValue;
        }
        private Answer() { }
        #endregion

        #region Class Methods Override 
        public override string ToString() => Value;
        #endregion

        #region Override Methods In Parent Class
        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Value;
        }
        #endregion

        #region Casting Excplicit And Implicit Operator Override
        public static explicit operator string(Answer title) => title.Value.ToString();
        public static implicit operator Answer(string value) => new Answer(value);
        #endregion

        #region Behaviors IMP
        private static string HasAnswer(string answer)
        {
            using (var sha256 = SHA256.Create())
            {
                byte[] bytes = Encoding.UTF8.GetBytes(answer);
                byte[] hash = sha256.ComputeHash(bytes);
                return Convert.ToBase64String(hash);
            }
        }
        public bool Verify(string answer)
        {
            string hashOfInput = HasAnswer(answer);
            return hashOfInput.Equals(Value);
        }

        #endregion
    }
}
