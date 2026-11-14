using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.ExamAggregate.Entities;

public class ExamAssignment : Entity
{
    public long ExamId { get; private set; }
    public long StudentId { get; private set; }
    public long UserId { get; private set; }
    public DateTime AssignedAtUtc { get; private set; }

    public Exam? Exam { get; private set; }

    private ExamAssignment() { }

    public static ExamAssignment Create(long studentId, long userId)
    {
        return new ExamAssignment
        {
            StudentId = studentId,
            UserId = userId,
            AssignedAtUtc = DateTime.UtcNow,
        };
    }
}
