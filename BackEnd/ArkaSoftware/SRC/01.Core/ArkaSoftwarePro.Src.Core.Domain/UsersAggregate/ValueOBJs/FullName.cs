using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs
{
    public class FullName : BaseValueOBJs<FullName>
    {
        #region Factories
        public static FullName Create(string firstName, string lastName) => new FullName(firstName, lastName);

        #endregion

        #region Properties
        public string? FirstName { get; private set; }
        public string? LastName { get; private set; }
        #endregion

        #region CTORs
        private FullName(string firstName, string lastName)
        {
            Validation(firstName, lastName);
            FirstName = firstName;
            LastName = lastName;
        }
        private FullName() { }
        #endregion

        #region Check Validation Method
        private void Validation(string firstName, string lastName)
        {
            if (string.IsNullOrWhiteSpace(firstName))
                throw new InvalidValueObjectStateException("First name cannot be empty.", nameof(firstName));

            if (string.IsNullOrWhiteSpace(lastName))
                throw new InvalidValueObjectStateException("Last name cannot be empty.", nameof(lastName));

            if (firstName.Length > 50)
                throw new InvalidValueObjectStateException("First name is too long.", nameof(firstName));

            if (lastName.Length > 50)
                throw new InvalidValueObjectStateException("Last name is too long.", nameof(lastName));

            if (!IsValidName(firstName) || !IsValidName(lastName))
                throw new InvalidValueObjectStateException("Name contains invalid characters.");

        }
        #endregion

        #region Class Methods Override 
        public override string ToString() => $"{FirstName} {LastName}";
        #endregion

        #region Override Methods In Parent Class
        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return new { FirstName, LastName };
        }
        #endregion

        #region Behaviors IMP
        // Method to validate if the name contains only valid characters (letters, spaces, hyphens)
        private static bool IsValidName(string name)
        {
            foreach (char c in name)
            {
                if (!char.IsLetter(c) && c != ' ' && c != '-')
                    return false;
            }
            return true;
        }

        #endregion

    }
}
