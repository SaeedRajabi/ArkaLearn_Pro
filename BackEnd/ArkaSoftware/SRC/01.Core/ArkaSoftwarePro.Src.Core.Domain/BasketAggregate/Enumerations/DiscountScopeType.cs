namespace ArkaSoftwarePro.Src.Core.Domain.BasketAggregate.Enumerations;

public enum DiscountScopeType : byte
{
    /// <summary>Applies to the whole cart.</summary>
    AllCourses = 0,
    /// <summary>Applies only to selected course(s).</summary>
    SpecificCourses = 1,
    /// <summary>Applies only to courses of a specific teacher.</summary>
    TeacherCourses = 2,
    /// <summary>Applies only for a specific student on selected course(s).</summary>
    StudentSpecific = 3
}
