using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.ValueOBJs
{
    public class Rating : BaseValueOBJs<Rating>
    {
        public int Likes { get; private set; }
        public int Dislikes { get; private set; }

        // Score property calculated automatically
        public double Score => Likes - Dislikes;

        // Constructor for initializing likes and dislikes
        public Rating(int likes, int dislikes)
        {
            if (likes < 0 || dislikes < 0)
                throw new ArgumentException("Likes and Dislikes cannot be negative.");

            Likes = likes;
            Dislikes = dislikes;
        }

        // Constructor to initialize with zero likes and dislikes
        public Rating() : this(0, 0) { }

        // Method to create a new Rating object with an added like
        public Rating AddLike()
        {
            return new Rating(Likes + 1, Dislikes);
        }

        // Method to create a new Rating object with an added dislike
        public Rating AddDislike()
        {
            return new Rating(Likes, Dislikes + 1);
        }
        protected override IEnumerable<object> GetEqualityComponents()
        {
            throw new NotImplementedException();
        }
    }
}
