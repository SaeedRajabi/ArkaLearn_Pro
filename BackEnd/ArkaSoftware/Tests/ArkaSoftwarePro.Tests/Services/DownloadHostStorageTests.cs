using System.Security.Claims;
using System.Reflection;
using ArkaSoftwarePro.Src.Core.Contracts.FileStorage;
using ArkaSoftwarePro.Src.Endpoints.API.Controllers;
using ArkaSoftwarePro.Src.Endpoints.API.Adapters.Uploads;
using ArkaSoftwarePro.Src.Endpoints.API.BackgroundServices.FileStorage;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.FileStorage;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;

namespace ArkaSoftwarePro.Tests.Services;

public class DownloadHostStorageTests
{
    [Theory]
    [InlineData(typeof(UserFileController), nameof(UserFileController.UploadFile))]
    [InlineData(typeof(UserFileController), nameof(UserFileController.UploadFileChunk))]
    [InlineData(typeof(RoomController), nameof(RoomController.UploadRoomFile))]
    [InlineData(typeof(RoomController), nameof(RoomController.UploadRoomFileChunk))]
    public void Upload_form_buffering_does_not_spill_accepted_files_to_the_API_disk(Type controller, string action)
    {
        var limits = controller.GetMethod(action)!.GetCustomAttribute<RequestFormLimitsAttribute>();
        Assert.NotNull(limits);
        Assert.True(limits.MemoryBufferThreshold >= limits.MultipartBodyLengthLimit);
    }

    [Fact]
    public void Expiry_uses_the_UTC_activity_marker_and_preserves_invalid_markers()
    {
        var cutoff = DateTimeOffset.Parse("2026-11-11T12:00:00Z");
        Assert.True(FtpFileStorage.IsExpiredMarker("2026-11-11T14:30:00+03:30", cutoff));
        Assert.False(FtpFileStorage.IsExpiredMarker("2026-11-11T13:00:00Z", cutoff));
        Assert.False(FtpFileStorage.IsExpiredMarker("unknown", cutoff));
    }

    [Fact]
    public void Legacy_cleanup_removes_only_expired_known_chunk_directories()
    {
        var root = Path.Combine(AppContext.BaseDirectory, "arka-chunk-cleanup-tests", Guid.NewGuid().ToString("N"));
        try
        {
            var chunks = Path.Combine(root, "users", "upload-chunks");
            var expired = Directory.CreateDirectory(Path.Combine(chunks, Guid.NewGuid().ToString("N")));
            var current = Directory.CreateDirectory(Path.Combine(chunks, Guid.NewGuid().ToString("N")));
            var unrelated = Directory.CreateDirectory(Path.Combine(chunks, "keep"));
            var unexpected = Directory.CreateDirectory(Path.Combine(chunks, Guid.NewGuid().ToString("N")));
            var old = DateTime.UtcNow.AddHours(-8);
            File.WriteAllText(Path.Combine(expired.FullName, "00000000.part"), "chunk");
            File.SetLastWriteTimeUtc(Path.Combine(expired.FullName, "00000000.part"), old);
            Directory.SetLastWriteTimeUtc(expired.FullName, old);
            File.WriteAllText(Path.Combine(unexpected.FullName, "keep.bin"), "file");
            File.SetLastWriteTimeUtc(Path.Combine(unexpected.FullName, "keep.bin"), old);
            Directory.SetLastWriteTimeUtc(unexpected.FullName, old);
            UploadCleanupBackgroundService.CleanupLegacyLocalChunks(root, TimeSpan.FromHours(6));
            Assert.False(Directory.Exists(expired.FullName));
            Assert.True(Directory.Exists(current.FullName));
            Assert.True(Directory.Exists(unrelated.FullName));
            Assert.True(File.Exists(Path.Combine(unexpected.FullName, "keep.bin")));
        }
        finally
        {
            if (Directory.Exists(root)) Directory.Delete(root, true);
        }
    }

    [Fact]
    public void Missing_or_wrong_sized_parts_cannot_be_finalized()
    {
        var parts = new Dictionary<string, long> { ["00000000.part"] = 4, ["00000002.part"] = 4 };
        Assert.Equal(new[] { 1, 2 }, FtpFileStorage.FindMissingChunks(parts, 3, 4, 10));
        parts["00000001.part"] = 4;
        parts["00000002.part"] = 2;
        Assert.Empty(FtpFileStorage.FindMissingChunks(parts, 3, 4, 10));
    }

    [Theory]
    [InlineData("users", "../other")]
    [InlineData("../rooms", "12345678123412341234123456789012")]
    public async Task Upload_directory_traversal_is_rejected_before_connecting(string scope, string id)
    {
        var storage = new FtpFileStorage(Options.Create(new FileStorageOptions()), NullLogger<FtpFileStorage>.Instance);
        await Assert.ThrowsAsync<ArgumentException>(() => storage.DeleteUploadAsync(scope, id));
    }

    [Fact]
    public async Task Remote_range_reads_support_resume_and_close_previous_connections()
    {
        var offsets = new List<long>();
        var sources = new List<MemoryStream>();
        var bytes = new byte[] { 0, 1, 2, 3, 4, 5 };
        await using var stream = new RemoteRangeReadStream(bytes.Length, (offset, _) =>
        {
            offsets.Add(offset);
            var source = new MemoryStream(bytes[(int)offset..]);
            sources.Add(source);
            return Task.FromResult<Stream>(source);
        });
        Assert.True(stream.CanSeek);
        var buffer = new byte[2];
        Assert.Equal(2, await stream.ReadAsync(buffer));
        Assert.Equal(new byte[] { 0, 1 }, buffer);
        stream.Seek(-2, SeekOrigin.End);
        Assert.False(sources[0].CanRead);
        Assert.Equal(2, await stream.ReadAsync(buffer));
        Assert.Equal(new byte[] { 4, 5 }, buffer);
        Assert.Equal(new long[] { 0, 4 }, offsets);
        Assert.Equal(0, await stream.ReadAsync(buffer));
        await stream.DisposeAsync();
        Assert.False(sources[1].CanRead);
    }

    [Fact]
    public async Task Remote_range_read_does_not_open_a_connection_until_data_is_requested()
    {
        var opener = new Mock<Func<long, CancellationToken, Task<Stream>>>();
        await using var stream = new RemoteRangeReadStream(8, opener.Object);
        stream.Seek(20, SeekOrigin.Begin);
        Assert.Equal(0, await stream.ReadAsync(new byte[3]));
        opener.VerifyNoOtherCalls();
        Assert.Throws<IOException>(() => stream.Seek(-1, SeekOrigin.Begin));
    }

    [Fact]
    public void Usage_includes_plan_capacity_and_never_reports_negative_remaining_space()
    {
        var options = new FileStorageOptions();
        Assert.Equal(50L * 1024 * 1024 * 1024, options.DownloadHostCapacityBytes);
        Assert.Equal(70, new DownloadStorageUsage(100, 30, DateTime.UtcNow).RemainingBytes);
        Assert.Equal(0, new DownloadStorageUsage(100, 130, DateTime.UtcNow).RemainingBytes);
    }

    private static UserFileController UsageController(string role, IRemoteUploadStorage storage, IMemoryCache cache)
    {
        var principal = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.Role, role) }, "test"));
        var actor = new Mock<ArkaSoftwarePro.Src.Core.Contracts.Users.Services.ICurrentActor>();
        actor.SetupGet(a => a.Principal).Returns(principal);
        var service = new ArkaSoftwarePro.Src.Core.ApplicationService.UserFilesServices.UserFileApplicationService(
            null!, null!, null!, storage, null!, cache,
            new ArkaSoftwarePro.Src.Core.ApplicationService.UserFilesServices.Uploads.UserFileUploadSessionStore(),
            NullLogger<ArkaSoftwarePro.Src.Core.ApplicationService.UserFilesServices.UserFileApplicationService>.Instance,
            actor.Object, null!);
        return new UserFileController(service)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = principal } },
        };
    }

    [Theory]
    [InlineData("teacher")]
    [InlineData("student")]
    public async Task Storage_usage_is_restricted_to_administrators(string role)
    {
        using var cache = new MemoryCache(new MemoryCacheOptions());
        var storage = new Mock<IRemoteUploadStorage>(MockBehavior.Strict);
        Assert.IsType<ForbidResult>(await UsageController(role, storage.Object, cache).GetStorageUsage());
        storage.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Usage_comes_from_remote_storage_and_is_cached_between_student_pages()
    {
        using var cache = new MemoryCache(new MemoryCacheOptions());
        var storage = new Mock<IRemoteUploadStorage>();
        var usage = new DownloadStorageUsage(100, 42, DateTime.UtcNow);
        storage.Setup(s => s.GetUsageAsync(It.IsAny<CancellationToken>())).ReturnsAsync(usage);
        var controller = UsageController("admin", storage.Object, cache);
        Assert.Same(usage, Assert.IsType<OkObjectResult>(await controller.GetStorageUsage()).Value);
        Assert.Same(usage, Assert.IsType<OkObjectResult>(await controller.GetStorageUsage()).Value);
        storage.Verify(s => s.GetUsageAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task An_unreachable_host_reports_failure_instead_of_zero_usage_and_can_be_retried()
    {
        using var cache = new MemoryCache(new MemoryCacheOptions());
        var storage = new Mock<IRemoteUploadStorage>();
        storage.SetupSequence(s => s.GetUsageAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new IOException("Host unavailable"))
            .ReturnsAsync(new DownloadStorageUsage(100, 20, DateTime.UtcNow));
        var controller = UsageController("admin", storage.Object, cache);
        Assert.Equal(502, Assert.IsType<ObjectResult>(await controller.GetStorageUsage()).StatusCode);
        Assert.IsType<OkObjectResult>(await controller.GetStorageUsage());
    }
}
