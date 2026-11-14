using Framework.Src.Core.Domain.Aggregates;
using ArkaSoftwarePro.Src.Core.Domain.BasketAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.Domain.BasketAggregate.Enumerations;

namespace ArkaSoftwarePro.Src.Core.Domain.BasketAggregate.Entities;

public class DiscountCode : AggregateRoot
{
    public Discount Discount { get; private set; } = null!;
    public DateTime ExpirationDate { get; private set; }
    public bool IsActive { get; private set; }
    public int UsageLimit { get; private set; }
    public int UsedCount { get; private set; }
    public DiscountScopeType ScopeType { get; private set; } = DiscountScopeType.AllCourses;
    public long? TeacherId { get; private set; }
    public long? StudentUserId { get; private set; }
    public string? Title { get; private set; }
    public bool IsManuallyDisabled { get; private set; }

    private readonly List<DiscountCodeCourseTarget> _courseTargets = new();
    public IReadOnlyCollection<DiscountCodeCourseTarget> CourseTargets => _courseTargets.AsReadOnly();

    private DiscountCode()
    {
    }

    public DiscountCode(Discount discount, DateTime expirationDate, int usageLimit)
        : this(
            discount,
            expirationDate,
            usageLimit,
            DiscountScopeType.AllCourses,
            teacherId: null,
            studentUserId: null,
            courseIds: null,
            title: null)
    {
    }

    private DiscountCode(
        Discount discount,
        DateTime expirationDateUtc,
        int usageLimit,
        DiscountScopeType scopeType,
        long? teacherId,
        long? studentUserId,
        IEnumerable<long>? courseIds,
        string? title)
    {
        Discount = discount ?? throw new ArgumentNullException(nameof(discount));
        ExpirationDate = DateTime.SpecifyKind(expirationDateUtc, DateTimeKind.Utc);
        UsageLimit = Math.Max(0, usageLimit);
        UsedCount = 0;
        ScopeType = scopeType;
        TeacherId = teacherId is > 0 ? teacherId : null;
        StudentUserId = studentUserId is > 0 ? studentUserId : null;
        Title = string.IsNullOrWhiteSpace(title) ? null : title.Trim();
        ReplaceCourseTargets(courseIds);
        ValidateScope();
        CheckIfActive();
    }

    public static DiscountCode Create(
        Discount discount,
        DateTime expirationDateUtc,
        int usageLimit,
        DiscountScopeType scopeType,
        long? teacherId = null,
        long? studentUserId = null,
        IEnumerable<long>? courseIds = null,
        string? title = null)
        => new(discount, expirationDateUtc, usageLimit, scopeType, teacherId, studentUserId, courseIds, title);

    public void Deactivate()
    {
        IsManuallyDisabled = true;
        IsActive = false;
    }

    public void Activate()
    {
        IsManuallyDisabled = false;
        CheckIfActive();
    }

    public decimal ApplyDiscount(decimal amount)
    {
        var discounted = PeekFinalAmount(amount);
        UsedCount++;
        CheckIfActive();
        return discounted;
    }

    public decimal PeekDiscountAmount(decimal subtotal)
    {
        EnsureCanApply();
        if (subtotal <= 0)
            return 0;

        return Discount.Type switch
        {
            DiscountType.FIXED => Math.Min(Discount.Amount, subtotal),
            DiscountType.PERCENTAGE => Math.Round(subtotal * Discount.Amount / 100m, 0, MidpointRounding.AwayFromZero),
            _ => 0,
        };
    }

    public decimal PeekFinalAmount(decimal amount)
    {
        EnsureCanApply();
        return Math.Max(0, amount - PeekDiscountAmount(amount));
    }

    public void RecordUsage()
    {
        EnsureCanApply();
        UsedCount++;
        CheckIfActive();
    }

    /// <summary>
    /// Eligible cart lines for this code given the current user and basket course metadata.
    /// </summary>
    public decimal GetEligibleSubtotal(
        long? currentUserId,
        IReadOnlyList<(long CourseId, long TeacherId, decimal LineTotal)> basketLines)
    {
        EnsureCanApply();
        if (basketLines.Count == 0)
            return 0;

        return ScopeType switch
        {
            DiscountScopeType.AllCourses => basketLines.Sum(x => x.LineTotal),
            DiscountScopeType.SpecificCourses =>
                basketLines.Where(x => _courseTargets.Any(t => t.CourseId == x.CourseId)).Sum(x => x.LineTotal),
            DiscountScopeType.TeacherCourses =>
                TeacherId is > 0
                    ? basketLines.Where(x => x.TeacherId == TeacherId.Value).Sum(x => x.LineTotal)
                    : 0,
            DiscountScopeType.StudentSpecific =>
                currentUserId is > 0 && StudentUserId == currentUserId
                    ? basketLines.Where(x => _courseTargets.Any(t => t.CourseId == x.CourseId)).Sum(x => x.LineTotal)
                    : 0,
            _ => 0
        };
    }

    public void CheckIfActive()
    {
        IsActive = !IsManuallyDisabled &&
                   DateTime.UtcNow < ExpirationDate &&
                   (UsageLimit == 0 || UsedCount < UsageLimit);
    }

    private void EnsureCanApply()
    {
        CheckIfActive();
        if (!IsActive)
            throw new InvalidOperationException("The discount code is expired or invalid.");

        if (UsageLimit != 0 && UsedCount >= UsageLimit)
            throw new InvalidOperationException("The discount code has already been used the maximum number of times.");
    }

    private void ReplaceCourseTargets(IEnumerable<long>? courseIds)
    {
        _courseTargets.Clear();
        if (courseIds is null)
            return;

        foreach (var id in courseIds.Where(x => x > 0).Distinct())
            _courseTargets.Add(new DiscountCodeCourseTarget(id));
    }

    private void ValidateScope()
    {
        switch (ScopeType)
        {
            case DiscountScopeType.AllCourses:
                TeacherId = null;
                StudentUserId = null;
                _courseTargets.Clear();
                break;
            case DiscountScopeType.SpecificCourses:
                TeacherId = null;
                StudentUserId = null;
                if (_courseTargets.Count == 0)
                    throw new InvalidOperationException("At least one course is required for this discount scope.");
                break;
            case DiscountScopeType.TeacherCourses:
                StudentUserId = null;
                _courseTargets.Clear();
                if (TeacherId is not > 0)
                    throw new InvalidOperationException("Teacher is required for this discount scope.");
                break;
            case DiscountScopeType.StudentSpecific:
                TeacherId = null;
                if (StudentUserId is not > 0)
                    throw new InvalidOperationException("Student is required for this discount scope.");
                if (_courseTargets.Count == 0)
                    throw new InvalidOperationException("At least one course is required for student-specific discounts.");
                break;
            default:
                throw new InvalidOperationException("Invalid discount scope.");
        }
    }
}
