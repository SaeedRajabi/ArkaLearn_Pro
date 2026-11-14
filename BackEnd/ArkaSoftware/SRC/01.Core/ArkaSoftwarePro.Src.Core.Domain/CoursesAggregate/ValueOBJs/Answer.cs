using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.ValueOBJs;

public class Answer : BaseValueOBJs<Answer>
{

    public static Answer Create(string answer) => new Answer(answer);

    public string? Content { get; private set; }

    private Answer(string content)
    {
        if (string.IsNullOrEmpty(content))
            throw new ArgumentException("Answer content cannot be empty", nameof(content));

        Content = content;
    }
    private Answer(){}
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Content!;
    }

    public override string ToString() => Content!;
}