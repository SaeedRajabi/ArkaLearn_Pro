using System.Threading.Channels;
using ArkaSoftwarePro.Src.Core.Contracts.Services;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.VideoWatermark;

public sealed class VideoWatermarkQueue : IVideoWatermarkQueue
{
    private readonly Channel<VideoWatermarkJob> _channel = Channel.CreateUnbounded<VideoWatermarkJob>(
        new UnboundedChannelOptions { SingleReader = true, SingleWriter = false });

    public void Enqueue(VideoWatermarkJob job)
    {
        if (job == null || string.IsNullOrWhiteSpace(job.SourceRelativePath))
            return;
        _channel.Writer.TryWrite(job);
    }

    public async ValueTask<VideoWatermarkJob?> DequeueAsync(CancellationToken cancellationToken)
    {
        var job = await _channel.Reader.ReadAsync(cancellationToken);
        return job;
    }
}
