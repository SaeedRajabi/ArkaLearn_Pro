using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.ValueOBJs
{
    public class SkillName : BaseValueOBJs<SkillName>
    {
        #region Factories
        public static SkillName FromString(string value) => new SkillName(value);

        #endregion

        #region Properties
        public string? Value { get; private set; }
        #endregion

        #region CTORs
        public SkillName(string value)
        {
            Validation(value);
            Value = value;
        }
        private SkillName() { }
        #endregion

        #region Check Validation Method
        private void Validation(string value)
        {
            if (string.IsNullOrEmpty(value))
                throw new InvalidValueObjectStateException("ValidationErrorIsRequired", nameof(SkillName));
            if (value.Length > 400)
                throw new InvalidValueObjectStateException("ValidationErrorStringLength", nameof(SkillName));

        }
        #endregion

        #region Class Methods Override 
        public override string ToString() => Value!;
        #endregion

        #region Override Methods In Parent Class
        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Value!;
        }
        #endregion

        #region Casting Excplicit And Implicit Operator Override
        public static explicit operator string(SkillName title) => title.Value!.ToString();
        public static implicit operator SkillName(string value) => new SkillName(value);
        #endregion
    }
}
