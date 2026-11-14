using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Enumerations;
using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities
{
    public class RoomFile : Entity
    {
        public long RoomId { get; private set; }
        public Room? Room { get; private set; }
        public RoomFileType FileType { get; private set; }
        public string Title { get; private set; } = string.Empty;
        public string? Description { get; private set; }
        public string FileName { get; private set; } = string.Empty;
        public string FileUrl { get; private set; } = string.Empty;
        public long FileSize { get; private set; }
        public string? UploadedByUserId { get; private set; }

        private RoomFile() { }

        public static RoomFile Create(
            long roomId,
            RoomFileType fileType,
            string title,
            string? description,
            string fileName,
            string fileUrl,
            long fileSize,
            string? uploadedByUserId = null)
        {
            if (string.IsNullOrWhiteSpace(fileName))
                throw new ArgumentException("File name is required.", nameof(fileName));
            if (string.IsNullOrWhiteSpace(fileUrl))
                throw new ArgumentException("File URL is required.", nameof(fileUrl));

            var normalizedTitle = string.IsNullOrWhiteSpace(title)
                ? Path.GetFileNameWithoutExtension(fileName.Trim())
                : title.Trim();
            if (string.IsNullOrWhiteSpace(normalizedTitle))
                normalizedTitle = fileName.Trim();

            return new RoomFile
            {
                RoomId = roomId,
                FileType = fileType,
                Title = normalizedTitle,
                Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim(),
                FileName = fileName.Trim(),
                FileUrl = fileUrl.Trim(),
                FileSize = fileSize >= 0 ? fileSize : 0,
                UploadedByUserId = uploadedByUserId
            };
        }
    }
}
