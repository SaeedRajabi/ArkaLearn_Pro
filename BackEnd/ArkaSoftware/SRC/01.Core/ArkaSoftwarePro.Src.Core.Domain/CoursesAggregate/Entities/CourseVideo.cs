using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.ValueOBJs;
using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities
{
    public class CourseVideo:Entity
    {
        public long CourseId { get; private set; }
        public Title? Title { get; private set; }
        public VideoURL? VideoPath { get; private set; }
        public TimeSpan Duration { get; private set; }

        private CourseVideo(long courseId , string title , string videoPath , TimeSpan duration)
        {
            CourseId = courseId;
            Title = title;
            VideoPath = videoPath;
            Duration = duration;

        }

        private CourseVideo()
        {
            
        }


        public static CourseVideo Create(long courseId, string title, string videoPath, TimeSpan duration)
            => new CourseVideo(courseId, title, videoPath, duration);


    }
}
