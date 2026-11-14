using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.ValueOBJs;
using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities
{
    public class CourseSection : Entity
    {
        public Title? SessionTitle { get; private set; }

        public long? CourseId { get; private set; }
        public Course? Course { get; private set; }

        public IReadOnlyList<CourseLesson> CourseLessons => _courseLessons;
        public List<CourseLesson> _courseLessons = new List<CourseLesson>();

        public CourseSection()
        {

        }
        public CourseSection(Title sessionTitle, long courseId, List<CourseLesson> courseLessons)
        {
            SessionTitle = sessionTitle;
            CourseId = courseId;
            _courseLessons.AddRange(courseLessons);
        }

        public void Rename(Title sessionTitle) => SessionTitle = sessionTitle;

        public void RemoveLesson(CourseLesson lesson)
        {
            if (lesson is null) return;
            _courseLessons.Remove(lesson);
        }

        public void AddLesson(CourseLesson lesson)
        {
            if (lesson is null) return;
            if (_courseLessons.Contains(lesson)) return;
            _courseLessons.Add(lesson);
        }
    }
}
