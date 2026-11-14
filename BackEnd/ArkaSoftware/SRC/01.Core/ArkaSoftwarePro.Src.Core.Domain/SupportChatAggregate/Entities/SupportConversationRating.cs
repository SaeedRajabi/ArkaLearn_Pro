using ArkaSoftwarePro.Src.Core.Domain.SupportChatAggregate.Enumerations;
using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.SupportChatAggregate.Entities;

public class SupportConversationRating : AggregateRoot
{
    public long ConversationId { get; private set; }
    public long StudentUserId { get; private set; }
    public long TeacherUserId { get; private set; }
    public SupportRatingLevel Level { get; private set; }
    public int ScorePoints { get; private set; }
    public string? Feedback { get; private set; }
    public DateTime RatedAtUtc { get; private set; }

    private SupportConversationRating() { }

    public static SupportConversationRating Create(
        long conversationId,
        long studentUserId,
        long teacherUserId,
        SupportRatingLevel level,
        string? feedback)
    {
        if (!SupportRatingScores.IsValid(level))
            throw new InvalidOperationException("Invalid rating level.");

        var trimmedFeedback = feedback?.Trim();
        if (trimmedFeedback?.Length > 500)
            trimmedFeedback = trimmedFeedback[..500];

        return new SupportConversationRating
        {
            ConversationId = conversationId,
            StudentUserId = studentUserId,
            TeacherUserId = teacherUserId,
            Level = level,
            ScorePoints = SupportRatingScores.GetPoints(level),
            Feedback = string.IsNullOrWhiteSpace(trimmedFeedback) ? null : trimmedFeedback,
            RatedAtUtc = DateTime.UtcNow,
        };
    }
}
