namespace ArkaSoftwarePro.Src.Core.Domain.Common;

public static class SeoMetadata
{
    public const int MaxTitleLength = 200;
    public const int MaxDescriptionLength = 320;
    public const int MaxOgImageUrlLength = 500;

    public static string? NormalizeTitle(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim()[..Math.Min(value.Trim().Length, MaxTitleLength)];

    public static string? NormalizeDescription(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim()[..Math.Min(value.Trim().Length, MaxDescriptionLength)];

    public static string? NormalizeOgImageUrl(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim()[..Math.Min(value.Trim().Length, MaxOgImageUrlLength)];
}
