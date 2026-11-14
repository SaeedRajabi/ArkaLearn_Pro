using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.ValueOBJs
{
    public class AverageRating : BaseValueOBJs<AverageRating>
    {
        #region Factories
        public static AverageRating FromString(string value, string numberOfRating)
            => new AverageRating(double.Parse(value), int.Parse(numberOfRating));

        #endregion

        #region Properties
        public double? Value { get; private set; }
        public int? NumberOfRatings { get; private set; }
        #endregion

        #region CTOR
        public AverageRating(double value, int numberOfRatings)
        {
            if (numberOfRatings < 0)
                throw new InvalidValueObjectStateException("Number of ratings cannot be negative.", nameof(numberOfRatings));

            if (value < 0 || value > 5)
                throw new InvalidValueObjectStateException("Average rating must be between 0 and 5.", nameof(value));

            Value = value;
            NumberOfRatings = numberOfRatings;
        }

        private AverageRating() { }
        #endregion

        #region Implementation Behavior Rich 
        public AverageRating AddNewRating(double newRating)
        {
            if (newRating < 0 || newRating > 5)
                throw new InvalidValueObjectStateException("Rating must be between 0 and 5.", nameof(newRating));

            double totalRating = Value * NumberOfRatings + newRating ?? 0;
            int updatedNumberOfRatings = NumberOfRatings + 1 ?? 0;
            double newAverage = totalRating / updatedNumberOfRatings;

            return new AverageRating(newAverage, updatedNumberOfRatings);
        }

        #endregion

        #region Class Methods Override 
        public override string ToString() => $"{Value}";
        #endregion

        #region Override Methods In Parent Class
        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Value;
            yield return NumberOfRatings;
        }
        #endregion

    }
}
