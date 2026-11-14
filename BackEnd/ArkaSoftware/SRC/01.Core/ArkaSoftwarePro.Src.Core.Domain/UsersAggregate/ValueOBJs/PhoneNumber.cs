using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.Domain.ValueOBJs;
using System.Text.RegularExpressions;

namespace ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs
{
    public class PhoneNumber : BaseValueOBJs<PhoneNumber>
    {
        #region Factories
        public static PhoneNumber Create(string countryCode, string number) => new PhoneNumber(countryCode, number);

        #endregion

        #region Properties
        public string CountryCode { get; private set; }
        public string Number { get; private set; }
        #endregion

        #region CTORs
        private PhoneNumber(string countryCode, string number)
        {
            Validation(countryCode, number);
            CountryCode = countryCode;
            Number = number;
        }
        private PhoneNumber() { }
        #endregion

        #region Check Validation Method
        private void Validation(string countryCode, string number)
        {
            if (string.IsNullOrWhiteSpace(countryCode))
                throw new InvalidValueObjectStateException("Country code cannot be empty.", nameof(countryCode));

            if (string.IsNullOrWhiteSpace(number))
                throw new InvalidValueObjectStateException("Phone number cannot be empty.", nameof(number));

            if (!IsValidCountryCode(countryCode))
                throw new InvalidValueObjectStateException("Invalid country code.", nameof(countryCode));

            if (!IsValidPhoneNumber(number))
                throw new InvalidValueObjectStateException("Invalid phone number format.", nameof(number));
        }
        #endregion

        #region Class Methods Override 
        public override string ToString() => $"{CountryCode} {Number}";
        #endregion

        #region Override Methods In Parent Class
        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return new { CountryCode, Number };
        }
        #endregion

        #region Behaviors IMP

        // Method to validate if the country code is valid (e.g., must start with '+' and be followed by digits)
        private static bool IsValidCountryCode(string countryCode)
        {
            return Regex.IsMatch(countryCode, @"^\+\d{1,3}$");
        }

        // Method to validate the phone number format (basic validation for digits, can be extended for more complex rules)
        private static bool IsValidPhoneNumber(string number)
        {
            return Regex.IsMatch(number, @"^\d{6,15}$"); // Example: phone number should be between 6 and 15 digits
        }

        #endregion
    }
}
