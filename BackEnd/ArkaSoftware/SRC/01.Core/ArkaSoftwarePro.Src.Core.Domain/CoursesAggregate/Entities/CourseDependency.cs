using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.ValueOBJs;
using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities
{
    public class CourseDependency:Entity
    {
        public long CourseId { get; private set; }
        public Course? Course { get; private set; }
        public Title? DependencyTitle { get; private set; }


        public CourseDependency(long courseId , Title dependencyTitle)
        {
            CourseId = courseId;
            DependencyTitle = dependencyTitle;
        }

        public CourseDependency()
        {
            
        }
    }
}
