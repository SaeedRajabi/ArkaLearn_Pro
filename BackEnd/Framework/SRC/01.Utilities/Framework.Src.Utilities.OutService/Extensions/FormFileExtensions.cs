using Microsoft.AspNetCore.Http;
using SkiaSharp;
namespace Framework.Src.Utilities.OutService.Extensions
{
    public static class FormFileExtensions
    {
        public static bool IsValidFileExtension(this IFormFile file, params string[] allowedExtensions)
        {
            if (file == null!) return false;

            var fileExtension = Path.GetExtension(file.FileName).ToLower();
            return allowedExtensions.Contains(fileExtension);
        }

        public static bool IsWithinSizeLimitExtension(this IFormFile file, long maxFileSize)
        {
            return file?.Length <= maxFileSize;
        }

        public static bool HaveValidDimensionsExtension(this IFormFile file)
        {
            if (file is null || file.Length <= 0) return false;
            using var stream = file.OpenReadStream();
            using var codec = SKCodec.Create(stream);
            if (codec is null || codec.Info.Width <= 0 || codec.Info.Height <= 0 ||
                codec.Info.Width > 600 || codec.Info.Height > 600)
                return false;

            // Decode only after checking dimensions, so oversized uploads never allocate a pixel buffer.
            using var bitmap = new SKBitmap(new SKImageInfo(codec.Info.Width, codec.Info.Height));
            return codec.GetPixels(bitmap.Info, bitmap.GetPixels()) == SKCodecResult.Success;
        }


        public static bool BeAValidMimeTypeExtension(this IFormFile file)
        {
            var allowedMimeTypes = new[] { "image/jpeg", "image/png", "image/gif" };
            return allowedMimeTypes.Contains(file.ContentType);
        }
        public static async Task<byte[]> ToByteArrayAsync(this IFormFile file)
        {
            if (file == null) throw new NullReferenceException("File Is Null");

            await using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);
            return memoryStream.ToArray();
        }

        public static async Task<string> SaveToPathAsync(this IFormFile file, string rootDirectory, string? customFileName = null)
        {
            if (file == null) throw new NullReferenceException("File Is Null");
            if (string.IsNullOrWhiteSpace(rootDirectory)) throw new ArgumentNullException(nameof(rootDirectory));

            var fileExtension = Path.GetExtension(file.FileName);
            var fileName = customFileName ?? $"{Guid.NewGuid()}{fileExtension}";
            var savePath = Path.Combine(rootDirectory, fileName);

            var directory = Path.GetDirectoryName(savePath);
            if (!Directory.Exists(directory))
                Directory.CreateDirectory(directory!);

            await using var stream = new FileStream(savePath, FileMode.Create);
            await file.CopyToAsync(stream);

            return savePath;
        }

        public static string ToPublicWebPath(this string savedPath, string webRootFolderName = "wwwroot")
        {
            if (string.IsNullOrWhiteSpace(savedPath))
                return string.Empty;

            var normalized = savedPath.Replace("\\", "/");
            var webRootMarker = $"/{webRootFolderName.Trim('/')}/";
            var markerIndex = normalized.LastIndexOf(webRootMarker, StringComparison.OrdinalIgnoreCase);

            if (markerIndex >= 0)
            {
                normalized = normalized[(markerIndex + webRootMarker.Length - 1)..];
            }
            else if (normalized.StartsWith($"{webRootFolderName.Trim('/')}/", StringComparison.OrdinalIgnoreCase))
            {
                normalized = normalized[webRootFolderName.Trim('/').Length..];
            }

            if (!normalized.StartsWith("/"))
                normalized = "/" + normalized;

            return normalized;
        }

    }
}
