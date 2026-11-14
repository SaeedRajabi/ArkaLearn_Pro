using System.Diagnostics;
using ArkaSoftwarePro.Src.Core.Contracts.Services;
using Microsoft.Extensions.Options;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.VideoWatermark;

public sealed class FfmpegVideoWatermarkProcessor(
    IWebHostEnvironment environment,
    IOptions<VideoWatermarkOptions> options,
    ILogger<FfmpegVideoWatermarkProcessor> logger) : IVideoWatermarkProcessor
{
    public async Task<string?> CreateWatermarkedCopyAsync(string sourceRelativePath, CancellationToken cancellationToken = default)
    {
        var settings = options.Value;
        if (!settings.Enabled)
            return null;

        var webRoot = environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot");
        var sourceRelative = NormalizeRelativePath(sourceRelativePath);
        var sourceFull = Path.GetFullPath(Path.Combine(webRoot, sourceRelative));
        if (!File.Exists(sourceFull))
        {
            logger.LogWarning("Watermark source file not found: {Path}", sourceFull);
            return null;
        }

        var logoRelative = NormalizeRelativePath(settings.LogoRelativePath);
        var logoFull = Path.GetFullPath(Path.Combine(webRoot, logoRelative));
        if (!File.Exists(logoFull))
        {
            logger.LogWarning("Watermark logo not found: {Path}", logoFull);
            return null;
        }

        var outputRelative = BuildOutputRelativePath(sourceRelative);
        var outputFull = Path.GetFullPath(Path.Combine(webRoot, outputRelative));
        Directory.CreateDirectory(Path.GetDirectoryName(outputFull)!);

        if (File.Exists(outputFull))
        {
            try
            {
                File.Delete(outputFull);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Could not delete existing watermarked file {Path}", outputFull);
            }
        }

        var ffmpeg = string.IsNullOrWhiteSpace(settings.FfmpegPath) ? "ffmpeg" : settings.FfmpegPath.Trim();
        var margin = Math.Max(0, settings.MarginPx);
        var widthRatio = Math.Clamp(settings.LogoWidthRatio, 0.05, 0.35);
        var opacity = Math.Clamp(settings.LogoOpacity, 0.2, 1.0);
        var filter = $"[1:v]format=rgba,colorchannelmixer=aa={opacity:0.##}[logo];" +
                     $"[logo][0:v]scale2ref=w=iw*{widthRatio:0.##}:h=ow/mdar[logo_scaled][video];" +
                     $"[video][logo_scaled]overlay=main_w-overlay_w-{margin}:main_h-overlay_h-{margin}";

        var args = $"-y -hide_banner -loglevel error -i \"{sourceFull}\" -i \"{logoFull}\" " +
                   $"-filter_complex \"{filter}\" -map 0:a? -c:a copy -c:v libx264 -preset veryfast -crf 23 \"{outputFull}\"";

        try
        {
            using var process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = ffmpeg,
                    Arguments = args,
                    RedirectStandardError = true,
                    RedirectStandardOutput = true,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                },
            };

            process.Start();
            var stderr = await process.StandardError.ReadToEndAsync(cancellationToken);
            await process.WaitForExitAsync(cancellationToken);

            if (process.ExitCode != 0 || !File.Exists(outputFull))
            {
                logger.LogWarning(
                    "FFmpeg watermark failed (exit {ExitCode}) for {Source}. {Error}",
                    process.ExitCode,
                    sourceRelative,
                    stderr.Trim());
                return null;
            }

            return "/" + outputRelative.Replace('\\', '/');
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "FFmpeg watermark process failed for {Source}", sourceRelative);
            return null;
        }
    }

    private static string BuildOutputRelativePath(string sourceRelative)
    {
        var extension = Path.GetExtension(sourceRelative);
        if (string.IsNullOrWhiteSpace(extension))
            extension = ".mp4";
        var directory = Path.GetDirectoryName(sourceRelative)?.Replace('\\', '/') ?? string.Empty;
        var fileName = Path.GetFileNameWithoutExtension(sourceRelative);
        var outputName = $"{fileName}_wm{extension}";
        return string.IsNullOrWhiteSpace(directory)
            ? outputName
            : $"{directory}/{outputName}";
    }

    private static string NormalizeRelativePath(string relativeUrl)
    {
        var value = relativeUrl.Trim().Replace('\\', '/');
        while (value.StartsWith('/'))
            value = value[1..];
        return value;
    }
}
