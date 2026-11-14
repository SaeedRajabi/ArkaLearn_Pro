namespace ArkaSoftwarePro.Src.Core.Domain.SupportChatAggregate.Enumerations;

public enum SupportRatingLevel : byte
{
    VeryUnhappy = 1,
    Unhappy = 2,
    Neutral = 3,
    Happy = 4,
    VeryHappy = 5,
}

public static class SupportRatingScores
{
    public static int GetPoints(SupportRatingLevel level) => level switch
    {
        SupportRatingLevel.VeryUnhappy => 10,
        SupportRatingLevel.Unhappy => 20,
        SupportRatingLevel.Neutral => 30,
        SupportRatingLevel.Happy => 40,
        SupportRatingLevel.VeryHappy => 50,
        _ => 0,
    };

    public static bool IsValid(SupportRatingLevel level) =>
        level is >= SupportRatingLevel.VeryUnhappy and <= SupportRatingLevel.VeryHappy;
}
