using Framework.Src.Core.Domain.Exceptions;

namespace Framework.Src.Core.Domain.ValueOBJs
{
    public class Image : BaseValueOBJs<Image>
    {
        #region Factories
        public static Image FromString(string url) => new Image(url);
        public static Image Create(string url) => new Image(url);
        #endregion

        #region Properties
        public string? ImageURL { get; private set; }
        #endregion

        #region CTORs
        public Image(string imageURL)
        {
            if (string.IsNullOrEmpty(imageURL))
                ImageURL = "/wwwroot/Course/Default/defaultCourseImage.png";
            if (imageURL.Length > 500)
                throw new InvalidValueObjectStateException("Image URL Length Is Not Valid.", nameof(imageURL), "500");
            ImageURL = imageURL;
        }

        private Image() { }

        #endregion

        #region Override Methods In Parent Class
        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return new object[] { ImageURL! };
        }
        #endregion

        #region Class Methods Override 
        public override string ToString() => ImageURL!;
        #endregion

        #region Behaivor
        public void UpdateImage(string newURL)
        {
            ImageURL = newURL;
        }
        #endregion

        #region Casting Excplicit And Implicit Operator Override
        public static explicit operator string(Image image) => image.ImageURL!.ToString();
        public static implicit operator Image(string URL) => new Image(URL);
        #endregion
    }
}
