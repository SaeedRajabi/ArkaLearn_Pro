namespace ArkaSoftwarePro.Src.Core.Domain.ExamAttemptAggregate.Enumerations;

public enum ExamAttemptStatus : byte
{
    Pending = 0,
    InProgress = 1,
    Submitted = 2,
    Abandoned = 3,
    Graded = 4,
}
