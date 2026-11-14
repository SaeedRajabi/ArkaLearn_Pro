using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.Domain.ValueOBJs;
using System.Text;

namespace ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs
{
    public class Question : BaseValueOBJs<Question>
    {
        #region Factories
        public static Question Create(string questionText) => new Question(questionText);
        #endregion

        #region Properties
        public string Value { get; private set; }
        #endregion

        #region CTORs
        public Question(string value)
        {
            Validation(value);
            Value = value;
        }
        private Question() { }
        #endregion

        #region Check Validation Method
        private void Validation(string value)
        {
            if (string.IsNullOrEmpty(value))
                throw new InvalidValueObjectStateException("Question text cannot be empty.", nameof(value));
            if (value.Length > 300)
                throw new InvalidValueObjectStateException("Question text cannot exceed 300 characters.", nameof(value));
        }
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
        public static explicit operator string(Question title) => title.Value.ToString();
        public static implicit operator Question(string value) => new Question(value);
        #endregion

    }
}
