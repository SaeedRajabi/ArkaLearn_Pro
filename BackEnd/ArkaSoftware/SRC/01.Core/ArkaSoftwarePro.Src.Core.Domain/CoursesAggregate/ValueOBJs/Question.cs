using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.ValueOBJs
{
    public class Question:BaseValueOBJs<Question>
    {
        public static Question Create(string content) => new Question(content);

        public string? Content { get; private set; }

        private Question(string content)
        {
            if (string.IsNullOrEmpty(content))
                throw new ArgumentException("Question content cannot be empty", nameof(content));

            Content = content;
        }

        private Question(){}


        public override string ToString() => Content!;

        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Content!;
        }
    }
}
