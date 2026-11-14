using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.StudentAggregate.ValueOBJs
{
    public class ContactInfo : BaseValueOBJs<ContactInfo>
    {
        public string? Email { get; private set; }
        public string? PhoneNumber { get; private set; }
        public string? Address { get; private set; }

        private ContactInfo() { }

        public ContactInfo(string email, string phoneNumber, string? address)
        {
            if (string.IsNullOrEmpty(email))
                throw new InvalidValueObjectStateException("ValidationErrorIsRequired", nameof(Email));
            if (string.IsNullOrEmpty(phoneNumber))
                throw new InvalidValueObjectStateException("ValidationErrorIsRequired", nameof(PhoneNumber));

            Email = email;
            PhoneNumber = phoneNumber;
            Address = address;
        }

        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Email!;
            yield return PhoneNumber!;
            yield return Address ?? string.Empty;
        }

        public override string ToString() => $"{Email}, {PhoneNumber}";
    }
}
