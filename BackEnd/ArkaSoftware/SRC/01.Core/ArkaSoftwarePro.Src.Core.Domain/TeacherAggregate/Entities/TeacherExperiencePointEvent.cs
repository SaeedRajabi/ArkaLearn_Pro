using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;

public class TeacherExperiencePointEvent : Entity
{
    public long TeacherId { get; private set; }
    public int Amount { get; private set; }
    public TeacherXpEventReason Reason { get; private set; }
    public string? Description { get; private set; }
    public int BalanceAfter { get; private set; }
    public DateTime OccurredAtUtc { get; private set; }

    private TeacherExperiencePointEvent() { }

    public static TeacherExperiencePointEvent Create(
        long teacherId,
        int amount,
        TeacherXpEventReason reason,
        string? description,
        int balanceAfter,
        DateTime occurredAtUtc)
    {
        return new TeacherExperiencePointEvent
        {
            TeacherId = teacherId,
            Amount = amount,
            Reason = reason,
            Description = description,
            BalanceAfter = balanceAfter,
            OccurredAtUtc = occurredAtUtc,
        };
    }
}
