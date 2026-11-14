using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.ValueOBJs
{
    public class VideoURL : BaseValueOBJs<VideoURL>
    {
        #region Factories
        public static VideoURL FromString(string value) => new VideoURL(value);

        #endregion

        #region Properties
        public string? Value { get; private set; }
        #endregion

        #region CTORs
        public VideoURL(string value)
        {
            Validation(value);
            Value = value;
        }
        private VideoURL() { }
        #endregion

        #region Check Validation Method
        private void Validation(string value)
        {
            if (string.IsNullOrEmpty(value))
                throw new InvalidValueObjectStateException("ValidationErrorIsRequired", nameof(VideoURL));
            if (value.Length > 500)
                throw new InvalidValueObjectStateException("ValidationErrorStringLength", nameof(VideoURL));

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
        public static explicit operator string(VideoURL title) => title.Value!.ToString();
        public static implicit operator VideoURL(string value) => new VideoURL(value);
        #endregion
    }
}
