using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;

public class TeacherXpService(ITeacherCommandRepository teacherCommandRepository)
{
    public static string EntityRef(long entityId) => $"ref:{entityId}";

    public static string EntityKeyRef(string entityKey) => $"ref:{entityKey}";

    public async Task AwardXpAsync(
        Teacher teacher,
        int amount,
        TeacherXpEventReason reason,
        string? description = null,
        CancellationToken cancellationToken = default)
    {
        if (amount <= 0) return;
        teacher.AddExperiencePoints(amount);
        await RecordEventAsync(teacher, amount, reason, description, cancellationToken);
        await teacherCommandRepository.CommitAsync();
    }

    public async Task TryAwardOnceAsync(
        Teacher teacher,
        int amount,
        TeacherXpEventReason reason,
        long? relatedEntityId = null,
        string? entityKey = null,
        CancellationToken cancellationToken = default)
    {
        if (amount <= 0) return;

        var descriptionRef = relatedEntityId is > 0
            ? EntityRef(relatedEntityId.Value)
            : !string.IsNullOrWhiteSpace(entityKey)
                ? EntityKeyRef(entityKey)
                : null;

        if (await teacherCommandRepository.HasPositiveXpEventAsync(
                teacher.Id,
                reason,
                descriptionRef,
                cancellationToken))
        {
            return;
        }

        await AwardXpAsync(teacher, amount, reason, descriptionRef, cancellationToken);
    }

    public async Task TryAwardOnceByUserIdAsync(
        long userId,
        int amount,
        TeacherXpEventReason reason,
        long? relatedEntityId = null,
        string? entityKey = null,
        CancellationToken cancellationToken = default)
    {
        if (amount <= 0 || userId <= 0) return;
        var teacher = await teacherCommandRepository.GetByUserIdWithDetailsAsync(userId, cancellationToken);
        if (teacher == null) return;
        await TryAwardOnceAsync(teacher, amount, reason, relatedEntityId, entityKey, cancellationToken);
    }

    public async Task AwardXpByUserIdAsync(
        long userId,
        int amount,
        TeacherXpEventReason reason,
        string? description = null,
        CancellationToken cancellationToken = default)
    {
        if (amount <= 0 || userId <= 0) return;
        var teacher = await teacherCommandRepository.GetByUserIdWithDetailsAsync(userId, cancellationToken);
        if (teacher == null) return;
        await AwardXpAsync(teacher, amount, reason, description, cancellationToken);
    }

    public async Task RecordRedeemEventAsync(
        Teacher teacher,
        int xpCost,
        CancellationToken cancellationToken = default)
    {
        if (xpCost <= 0) return;
        await RecordEventAsync(
            teacher,
            -xpCost,
            TeacherXpEventReason.RedeemFreeMonth,
            "Redeemed 1 free advertisement month",
            cancellationToken);
    }

    public async Task<int> GetNextThresholdAsync(Teacher teacher, CancellationToken cancellationToken = default)
    {
        var settings = await teacherCommandRepository.GetOrCreateMonetizationSettingsAsync(cancellationToken);
        return teacher.GetXpThresholdForNextFreeMonth(
            settings.XpFirstFreeMonthThreshold,
            settings.XpThresholdIncrementPerMonth);
    }

    private async Task RecordEventAsync(
        Teacher teacher,
        int amount,
        TeacherXpEventReason reason,
        string? description,
        CancellationToken cancellationToken)
    {
        var evt = TeacherExperiencePointEvent.Create(
            teacher.Id,
            amount,
            reason,
            description,
            teacher.ExperiencePoints,
            DateTime.UtcNow);
        await teacherCommandRepository.AddXpEventAsync(evt, cancellationToken);
    }
}
