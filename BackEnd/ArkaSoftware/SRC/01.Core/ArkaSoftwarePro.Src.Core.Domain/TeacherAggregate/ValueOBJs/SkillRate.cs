using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.ValueOBJs;

public class SkillRate : BaseValueOBJs<SkillRate>
{
     
    #region Factories
    public static SkillRate FromString(int value) => new SkillRate(value);

    #endregion

    #region Properties
    public int? Value { get; private set; }
    #endregion

    #region CTORs
    public SkillRate(int value)
    {
        Validation(value);
        Value = value;
    }
    private SkillRate() { }
    #endregion

    #region Check Validation Method
    private void Validation(int value)
    {
        if (value < 0 || value > 100)
            throw new InvalidValueObjectStateException("Rate must be between 0 and 100.", nameof(SkillName));
    }
    #endregion

    #region Class Methods Override 
    public override string ToString() => $"{Value!}%";
    #endregion

    #region Override Methods In Parent Class
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value!;
    }
    #endregion

    #region Casting Excplicit And Implicit Operator Override

    public static bool operator >(SkillRate left, SkillRate right) => left.Value > right.Value;
    public static bool operator <(SkillRate left, SkillRate right) => left.Value < right.Value;

    public static bool operator >=(SkillRate left, SkillRate right) => left.Value >= right.Value;
    public static bool operator <=(SkillRate left, SkillRate right) => left.Value <= right.Value;
    #endregion
}