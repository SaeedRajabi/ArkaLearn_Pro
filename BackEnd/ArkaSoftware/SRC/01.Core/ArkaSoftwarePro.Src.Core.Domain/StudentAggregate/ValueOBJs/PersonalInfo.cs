using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.StudentAggregate.ValueOBJs
{
    public class PersonalInfo:BaseValueOBJs<PersonalInfo>
    {
        public string? FirstName { get; private set; }
        public string? LastName { get; private set; }
        public DateTime? BirthDate { get; private set; }

        private PersonalInfo() { }

        public PersonalInfo(string firstName, string lastName, DateTime birthDate)
        {
            if (string.IsNullOrEmpty(firstName))
                throw new InvalidValueObjectStateException("ValidationErrorIsRequired", nameof(FirstName));
            if (string.IsNullOrEmpty(lastName))
                throw new InvalidValueObjectStateException("ValidationErrorIsRequired", nameof(LastName));
            if (birthDate > DateTime.UtcNow)
                throw new InvalidValueObjectStateException("ValidationErrorInvalidBirthDate", nameof(BirthDate));

            FirstName = firstName;
            LastName = lastName;
            BirthDate = birthDate;
        }

        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return FirstName;
            yield return LastName;
            yield return BirthDate;
        }

        public override string ToString() => $"{FirstName} {LastName}";
    }
}
