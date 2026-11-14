using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities
{
    public class CourseLesson : Entity
    {
        public Title? LessonTitle { get; private set; }
        public Title? VideoTitle { get; private set; }
        public VideoURL? VideoPath { get; private set; }
        public VideoURL? WatermarkedVideoPath { get; private set; }
        public int DurationSeconds { get; private set; }
        public int SortOrder { get; private set; }
        public bool IsPublished { get; private set; }
        public DateTime? PublishedAtUtc { get; private set; }
        public TeacherApprovalStatus VideoModerationStatus { get; private set; } = TeacherApprovalStatus.Draft;
        public string? VideoRejectionNote { get; private set; }
        public DateTime? VideoSubmittedAtUtc { get; private set; }
        public long? CourseSectionId { get; set; }
        public CourseSection? CourseSection { get; set; }
        public long? MediaAssetId { get; private set; }

        public CourseLesson(Title lessonTitle, int sortOrder = 0)
        {
            LessonTitle = lessonTitle;
            SortOrder = sortOrder;
        }

        public CourseLesson()
        {
        }

        public void SetSortOrder(int sortOrder) => SortOrder = sortOrder;

        public void Rename(Title lessonTitle) => LessonTitle = lessonTitle;

        public void SetLessonVideo(string? videoTitle, string? videoPath, int durationSeconds)
        {
            if (string.IsNullOrWhiteSpace(videoPath))
            {
                ClearLessonVideo();
                return;
            }

            VideoTitle = string.IsNullOrWhiteSpace(videoTitle)
                ? LessonTitle
                : new Title(videoTitle.Trim());
            VideoPath = VideoURL.FromString(videoPath.Trim());
            WatermarkedVideoPath = null;
            DurationSeconds = Math.Max(0, durationSeconds);
        }

        public void SetEncryptedLessonVideo(string? videoTitle, long mediaAssetId, int durationSeconds)
        {
            if (mediaAssetId <= 0)
            {
                ClearLessonVideo();
                return;
            }

            MediaAssetId = mediaAssetId;
            VideoTitle = string.IsNullOrWhiteSpace(videoTitle)
                ? LessonTitle
                : new Title(videoTitle.Trim());
            VideoPath = VideoURL.FromString($"drm://media/{mediaAssetId}");
            WatermarkedVideoPath = null;
            DurationSeconds = Math.Max(0, durationSeconds);
        }

        public bool IsDesktopEncryptedLesson => MediaAssetId is > 0;

        public void ClearLessonVideo()
        {
            VideoTitle = null;
            VideoPath = null;
            WatermarkedVideoPath = null;
            MediaAssetId = null;
            DurationSeconds = 0;
        }

        public void SetPublished(bool isPublished, DateTime? publishedAtUtc = null)
        {
            IsPublished = isPublished;
            PublishedAtUtc = isPublished ? publishedAtUtc ?? DateTime.UtcNow : null;
        }

        public bool IsVideoPubliclyAccessible =>
            IsPublished
            && VideoModerationStatus == TeacherApprovalStatus.Approved
            && !string.IsNullOrWhiteSpace(VideoPath?.Value);

        public void ApplyVideoModerationOnSave(bool hasVideo, bool isPublished, bool isAdmin, bool videoChanged)
        {
            if (!hasVideo || !isPublished)
            {
                if (!isAdmin)
                {
                    VideoModerationStatus = TeacherApprovalStatus.Draft;
                    VideoRejectionNote = null;
                }
                return;
            }

            if (isAdmin)
            {
                VideoModerationStatus = TeacherApprovalStatus.Approved;
                VideoRejectionNote = null;
                return;
            }

            if (!videoChanged && VideoModerationStatus == TeacherApprovalStatus.Approved)
                return;

            VideoModerationStatus = TeacherApprovalStatus.Pending;
            VideoRejectionNote = null;
            VideoSubmittedAtUtc = DateTime.UtcNow;
        }

        public void RestoreVideoModerationState(
            TeacherApprovalStatus status,
            string? rejectionNote,
            DateTime? submittedAtUtc)
        {
            VideoModerationStatus = status;
            VideoRejectionNote = rejectionNote;
            VideoSubmittedAtUtc = submittedAtUtc;
        }

        public void SetVideoModerationStatus(TeacherApprovalStatus status, string? rejectionNote = null)
        {
            VideoModerationStatus = status;
            VideoRejectionNote = status == TeacherApprovalStatus.Rejected ? rejectionNote?.Trim() : null;
            if (status == TeacherApprovalStatus.Pending)
                VideoSubmittedAtUtc = DateTime.UtcNow;
        }

        public void SetWatermarkedVideoPath(string? watermarkedVideoPath)
        {
            WatermarkedVideoPath = string.IsNullOrWhiteSpace(watermarkedVideoPath)
                ? null
                : VideoURL.FromString(watermarkedVideoPath.Trim());
        }

        public string? ResolvePlaybackVideoPath()
        {
            if (VideoModerationStatus == TeacherApprovalStatus.Approved
                && !string.IsNullOrWhiteSpace(WatermarkedVideoPath?.Value))
                return WatermarkedVideoPath!.Value;
            return VideoPath?.Value;
        }
    }
}
