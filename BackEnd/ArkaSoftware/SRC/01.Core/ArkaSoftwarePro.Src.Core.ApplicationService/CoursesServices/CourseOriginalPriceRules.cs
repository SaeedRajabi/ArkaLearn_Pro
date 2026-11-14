namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices;

public static class CourseOriginalPriceRules
{
    public static bool TryNormalize(
        decimal coursePrice,
        decimal? originalPrice,
        out decimal? normalized,
        out string? errorMessage)
    {
        normalized = null;
        errorMessage = null;

        if (!originalPrice.HasValue || originalPrice.Value <= 0)
            return true;

        if (coursePrice <= 0)
        {
            errorMessage = "Cannot set original price on a free course.";
            return false;
        }

        if (originalPrice.Value <= coursePrice)
        {
            errorMessage = "Original price must be greater than the sale price.";
            return false;
        }

        normalized = originalPrice.Value;
        return true;
    }
}
