using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.ValueOBJs;

public class NameOfUniversity : BaseValueOBJs<NameOfUniversity>
{
    #region Factories
    public static NameOfUniversity FromString(string value) => new NameOfUniversity(value);

    #endregion

    #region Properties
    public string? Value { get; private set; }
    #endregion

    #region CTORs
    public NameOfUniversity(string value)
    {
        Validation(value);
        Value = value;
    }
    private NameOfUniversity() { }
    #endregion

    #region Check Validation Method
    private void Validation(string value)
    {
        if (string.IsNullOrEmpty(value))
            throw new InvalidValueObjectStateException("ValidationErrorIsRequired", nameof(SkillName));
        if (value.Length > 500)
            throw new InvalidValueObjectStateException("ValidationErrorStringLength", nameof(SkillName));

    }
    #endregion

    #region Class Methods Override 
    public override string ToString() => Value!;
    #endregion

    #region Override Methods In Parent Class
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value!;
    }
    #endregion

    #region Casting Excplicit And Implicit Operator Override
    public static explicit operator string(NameOfUniversity title) => title.Value!.ToString();
    public static implicit operator NameOfUniversity(string value) => new NameOfUniversity(value);
    #endregion
}