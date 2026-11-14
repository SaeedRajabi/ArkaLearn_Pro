using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.ValueOBJs
{
    public class LongDescription : BaseValueOBJs<LongDescription>
    {
        #region Factories
        public static LongDescription FromString(string value) => new LongDescription(value);

        #endregion

        #region Properties
        public string? Value { get; private set; }
        #endregion

        #region CTORs
        public LongDescription(string value = "None")
        {
            Validation(value);
            Value = value;
        }
        private LongDescription() { }
        #endregion

        #region Check Validation Method
        private void Validation(string value)
        {
            if (string.IsNullOrEmpty(value))
                Value = "توضیحات تکمیلی دوره در این بخش قرار میگیرد.";

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
        public static explicit operator string(LongDescription title) => title.Value!.ToString();
        public static implicit operator LongDescription(string value) => new LongDescription(value);
        #endregion
    }
}
