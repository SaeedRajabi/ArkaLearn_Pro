using System.Collections.Concurrent;
using ArkaSoftwarePro.Src.Core.Contracts.Caching;
using ArkaSoftwarePro.Src.Core.Contracts.FileStorage;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.GetArticleById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.SearchArticles;
using ArkaSoftwarePro.Src.Core.RequestResponse.Categories.Queries.GetCategoryById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Categories.Queries.SearchCategoryByInputValue;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetAllPopularCourse;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetCourseBySlug;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetCoursesById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.SearchCoursesWithInputValue;
using ArkaSoftwarePro.Src.Core.RequestResponse.Projects.Queries.GetProjectById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Projects.Queries.GetProjectBySlug;
using ArkaSoftwarePro.Src.Core.RequestResponse.Projects.Queries.SearchProjects;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetSeminarById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.SearchSeminars;
using ArkaSoftwarePro.Src.Core.RequestResponse.Software.Queries.GetSoftwareBySlug;
using ArkaSoftwarePro.Src.Core.RequestResponse.Software.Queries.SearchSoftware;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherAdvertisement;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherBooks;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherProfile;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.SearchTeacherBooks;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.SearchTeachers;
using Framework.Src.Core.Contracts.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Queries;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CacheSettingsServices;

/// <summary>
/// Rebuilds query-cache regions from the database. Media bytes stay on the download host (msg);
/// this service only warms query results and optionally HEAD-checks public media URLs.
/// </summary>
public sealed class CacheWarmupService(
    IServiceScopeFactory scopeFactory,
    ICacheSettingsCache settingsCache,
    IHttpClientFactory httpClientFactory,
    IOptions<FileStorageOptions> fileStorageOptions,
    ILogger<CacheWarmupService> logger) : ICacheWarmupService
{
    private const int ListPageSize = 80;
    // Each parallel item holds its own DbContext/connection for the whole multi-query
    // enumeration; over a WAN keep this modest so the pool still serves live traffic.
    private const int DetailConcurrency = 4;
    private const int MediaHeadSampleSize = 40;
    private static readonly TimeSpan JobTimeout = TimeSpan.FromMinutes(8);

    private readonly ConcurrentDictionary<string, CacheWarmupProgress> _jobs = new();
    private readonly object _runGate = new();
    private string? _activeJobId;
    private CancellationTokenSource? _activeCts;

    public async Task<CacheWarmupProgress> StartAsync(CancellationToken cancellationToken = default)
    {
        var snapshot = await settingsCache.GetSnapshotAsync(cancellationToken);
        if (!snapshot.IsEnabled)
            throw new InvalidOperationException("Enable cache before starting warmup.");

        lock (_runGate)
        {
            if (_activeJobId is not null
                && _jobs.TryGetValue(_activeJobId, out var active)
                && string.Equals(active.Status, "Running", StringComparison.OrdinalIgnoreCase))
            {
                Touch(active);
                return Clone(active);
            }

            _activeCts?.Cancel();
            _activeCts?.Dispose();
            _activeCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            _activeCts.CancelAfter(JobTimeout);

            var jobId = Guid.NewGuid().ToString("N");
            var progress = new CacheWarmupProgress
            {
                JobId = jobId,
                Status = "Running",
                Percent = 0,
                CurrentStep = "cache_warmup_step_starting",
                StartedAtUtc = DateTimeOffset.UtcNow,
                UpdatedAtUtc = DateTimeOffset.UtcNow,
            };
            _jobs[jobId] = progress;
            _activeJobId = jobId;

            var token = _activeCts.Token;
            _ = Task.Run(() => RunJobAsync(jobId, token), CancellationToken.None);
            return Clone(progress);
        }
    }

    public CacheWarmupProgress GetStatus(string? jobId = null)
    {
        var id = string.IsNullOrWhiteSpace(jobId) ? _activeJobId : jobId;
        if (string.IsNullOrWhiteSpace(id) || !_jobs.TryGetValue(id, out var progress))
        {
            return new CacheWarmupProgress
            {
                JobId = id ?? string.Empty,
                Status = "Idle",
                Percent = 0,
                CurrentStep = "cache_warmup_step_idle",
                UpdatedAtUtc = DateTimeOffset.UtcNow,
            };
        }

        // Recover UI/backend from a hung Running job (e.g. process recycle mid-run).
        if (string.Equals(progress.Status, "Running", StringComparison.OrdinalIgnoreCase)
            && progress.UpdatedAtUtc is { } updated
            && DateTimeOffset.UtcNow - updated > TimeSpan.FromMinutes(3))
        {
            progress.Status = "Failed";
            progress.Error ??= "Cache warmup stalled and was marked failed.";
            progress.CurrentStep = "cache_warmup_step_failed";
            progress.FinishedAtUtc = DateTimeOffset.UtcNow;
            Touch(progress);
            lock (_runGate)
            {
                if (string.Equals(_activeJobId, id, StringComparison.Ordinal))
                    _activeJobId = null;
            }
        }

        return Clone(progress);
    }

    private async Task RunJobAsync(string jobId, CancellationToken cancellationToken)
    {
        if (!_jobs.TryGetValue(jobId, out var progress))
            return;

        var stepErrors = new List<string>();

        try
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var dispatcher = scope.ServiceProvider.GetRequiredService<IQueryDispatcher>();
            var cache = scope.ServiceProvider.GetRequiredService<IApplicationCacheService>();

            SetStep(progress, "cache_warmup_step_clearing", 2);
            await cache.InvalidateAllAsync(cancellationToken);

            var mediaUrls = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            // `dispatcher` (from this single scope) is only used for the sequential
            // search queries below; every parallel fan-out creates its own scope so
            // the scoped DbContext is never used by two operations at once.
            var steps = BuildSteps(dispatcher, scopeFactory, progress, mediaUrls);
            progress.TotalItems = steps.Count;
            progress.CompletedItems = 0;
            SetStep(progress, "cache_warmup_step_starting", 3);

            for (var i = 0; i < steps.Count; i++)
            {
                cancellationToken.ThrowIfCancellationRequested();
                var (name, action) = steps[i];
                SetStep(progress, name, PercentFor(i, steps.Count));
                try
                {
                    await action(cancellationToken);
                }
                catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
                {
                    throw;
                }
                catch (Exception stepEx)
                {
                    logger.LogWarning(stepEx, "Cache warmup step failed: {Step}", name);
                    stepErrors.Add($"{name}: {stepEx.Message}");
                }

                progress.CompletedItems = i + 1;
                SetStep(progress, name, PercentFor(i + 1, steps.Count));
            }

            cancellationToken.ThrowIfCancellationRequested();
            SetStep(progress, "cache_warmup_step_media_check", Math.Min(97, progress.Percent));
            await ProbeMediaHeadsAsync(mediaUrls, progress, cancellationToken);

            progress.Status = stepErrors.Count == 0 ? "Completed" : "Completed";
            progress.Percent = 100;
            progress.CurrentStep = stepErrors.Count == 0
                ? "cache_warmup_step_completed"
                : "cache_warmup_step_completed_with_warnings";
            progress.Error = stepErrors.Count == 0
                ? null
                : string.Join(" | ", stepErrors.Take(3));
            progress.FinishedAtUtc = DateTimeOffset.UtcNow;
            Touch(progress);
            logger.LogInformation(
                "Cache warmup {JobId} finished Status={Status} Warnings={WarningCount}",
                jobId, progress.Status, stepErrors.Count);
        }
        catch (OperationCanceledException)
        {
            progress.Status = "Failed";
            progress.Error = "Cache warmup timed out or was cancelled.";
            progress.CurrentStep = "cache_warmup_step_failed";
            progress.FinishedAtUtc = DateTimeOffset.UtcNow;
            Touch(progress);
            logger.LogWarning("Cache warmup {JobId} cancelled/timed out", jobId);
        }
        catch (Exception ex)
        {
            progress.Status = "Failed";
            progress.Error = ex.Message;
            progress.CurrentStep = "cache_warmup_step_failed";
            progress.FinishedAtUtc = DateTimeOffset.UtcNow;
            Touch(progress);
            logger.LogError(ex, "Cache warmup {JobId} failed", jobId);
        }
        finally
        {
            lock (_runGate)
            {
                if (string.Equals(_activeJobId, jobId, StringComparison.Ordinal))
                    _activeJobId = null;
            }
        }
    }

    private List<(string Name, Func<CancellationToken, Task> Action)> BuildSteps(
        IQueryDispatcher dispatcher,
        IServiceScopeFactory scopeFactory,
        CacheWarmupProgress progress,
        HashSet<string> mediaUrls)
    {
        return
        [
            ("cache_warmup_step_categories", async ct =>
            {
                var page = await dispatcher.Execute<SearchCategoryQuery, PagedData<SearchCategoryQri>>(
                    new SearchCategoryQuery { PageNumber = 1, PageSize = ListPageSize, NeedTotalCount = true });
                var rows = page.Data?.QueryResult ?? [];
                await ForEachAsync(scopeFactory, rows, DetailConcurrency, ct, async (itemDispatcher, row) =>
                {
                    CollectMedia(mediaUrls, row.ImageUrl);
                    await itemDispatcher.Execute<GetCategoryByIdQuery, CategoryQri>(
                        new GetCategoryByIdQuery { CategoryId = row.CategoryId });
                });
            }),
            ("cache_warmup_step_courses", async ct =>
            {
                var search = await dispatcher.Execute<SearchCourseByInputValueQuery, PagedData<SearchCourseQri>>(
                    new SearchCourseByInputValueQuery
                    {
                        PageNumber = 1,
                        PageSize = ListPageSize,
                        NeedTotalCount = true,
                        InputValue = "",
                    });
                await dispatcher.Execute<GetAllPopularCourseQuery, PagedData<GetAllPopularCourseQri>>(
                    new GetAllPopularCourseQuery { PageNumber = 1, PageSize = 40, NeedTotalCount = true });

                var rows = search.Data?.QueryResult ?? [];
                await ForEachAsync(scopeFactory, rows, DetailConcurrency, ct, async (itemDispatcher, row) =>
                {
                    CollectMedia(mediaUrls, row.TitleImage);
                    if (row.Id > 0)
                        await itemDispatcher.Execute<GetCourseByIdQuery, CourseQri>(new GetCourseByIdQuery { CourseId = row.Id });
                    if (!string.IsNullOrWhiteSpace(row.Slug))
                        await itemDispatcher.Execute<GetCourseBySlugQuery, CourseQri>(new GetCourseBySlugQuery { Slug = row.Slug });
                });
            }),
            ("cache_warmup_step_articles", async ct =>
            {
                var search = await dispatcher.Execute<SearchArticleByInputValueQuery, PagedData<SearchArticleQri>>(
                    new SearchArticleByInputValueQuery
                    {
                        PageNumber = 1,
                        PageSize = ListPageSize,
                        NeedTotalCount = true,
                        InputValue = "",
                    });
                var rows = search.Data?.QueryResult ?? [];
                await ForEachAsync(scopeFactory, rows, DetailConcurrency, ct, async (itemDispatcher, row) =>
                {
                    CollectMedia(mediaUrls, row.ThumbnailUrl);
                    if (row.Id > 0)
                        await itemDispatcher.Execute<GetArticleByIdQuery, ArticleQri>(new GetArticleByIdQuery { ArticleId = row.Id });
                });
            }),
            ("cache_warmup_step_seminars", async ct =>
            {
                var search = await dispatcher.Execute<SearchSeminarByInputValueQuery, PagedData<SearchSeminarQri>>(
                    new SearchSeminarByInputValueQuery
                    {
                        PageNumber = 1,
                        PageSize = ListPageSize,
                        NeedTotalCount = true,
                        InputValue = "",
                    });
                var rows = search.Data?.QueryResult ?? [];
                await ForEachAsync(scopeFactory, rows, DetailConcurrency, ct, async (itemDispatcher, row) =>
                {
                    CollectMedia(mediaUrls, row.ThumbnailUrl);
                    if (row.Id > 0)
                        await itemDispatcher.Execute<GetSeminarByIdQuery, SeminarQri>(new GetSeminarByIdQuery { SeminarId = row.Id });
                });
            }),
            ("cache_warmup_step_software", async ct =>
            {
                var search = await dispatcher.Execute<SearchSoftwareQuery, PagedData<SoftwareListItemQri>>(
                    new SearchSoftwareQuery { PageNumber = 1, PageSize = ListPageSize, NeedTotalCount = true });
                var rows = search.Data?.QueryResult ?? [];
                await ForEachAsync(scopeFactory, rows, DetailConcurrency, ct, async (itemDispatcher, row) =>
                {
                    CollectMedia(mediaUrls, row.CoverImageUrl);
                    if (!string.IsNullOrWhiteSpace(row.Slug))
                        await itemDispatcher.Execute<GetSoftwareBySlugQuery, SoftwarePublicQri?>(
                            new GetSoftwareBySlugQuery { Slug = row.Slug });
                });
            }),
            ("cache_warmup_step_projects", async ct =>
            {
                var search = await dispatcher.Execute<SearchProjectByInputValueQuery, PagedData<SearchProjectQri>>(
                    new SearchProjectByInputValueQuery
                    {
                        PageNumber = 1,
                        PageSize = ListPageSize,
                        NeedTotalCount = true,
                        InputValue = "",
                    });
                var rows = search.Data?.QueryResult ?? [];
                await ForEachAsync(scopeFactory, rows, DetailConcurrency, ct, async (itemDispatcher, row) =>
                {
                    CollectMedia(mediaUrls, row.ThumbnailUrl);
                    if (row.Id > 0)
                        await itemDispatcher.Execute<GetProjectByIdQuery, ProjectQri>(new GetProjectByIdQuery { ProjectId = row.Id });
                    if (!string.IsNullOrWhiteSpace(row.Slug))
                        await itemDispatcher.Execute<GetProjectBySlugQuery, ProjectQri>(new GetProjectBySlugQuery { Slug = row.Slug });
                });
            }),
            ("cache_warmup_step_books", async ct =>
            {
                var search = await dispatcher.Execute<SearchTeacherBooksQuery, PagedData<TeacherBookListItemQri>>(
                    new SearchTeacherBooksQuery
                    {
                        PageNumber = 1,
                        PageSize = ListPageSize,
                        NeedTotalCount = true,
                        Search = "",
                    });
                var rows = search.Data?.QueryResult ?? [];
                foreach (var row in rows)
                    CollectMedia(mediaUrls, row.CoverImageUrl);
            }),
            ("cache_warmup_step_teachers", async ct =>
            {
                var search = await dispatcher.Execute<SearchTeachersQuery, PagedData<SearchTeacherQri>>(
                    new SearchTeachersQuery
                    {
                        PageNumber = 1,
                        PageSize = ListPageSize,
                        NeedTotalCount = true,
                        InputValue = "",
                    });
                var rows = search.Data?.QueryResult ?? [];
                await ForEachAsync(scopeFactory, rows, Math.Min(4, DetailConcurrency), ct, async (itemDispatcher, row) =>
                {
                    CollectMedia(mediaUrls, row.AvatarUrl);
                    CollectMedia(mediaUrls, row.HeaderImageUrl);
                    if (!string.IsNullOrWhiteSpace(row.UserName))
                    {
                        await itemDispatcher.Execute<GetTeacherProfileQuery, TeacherProfileQri>(
                            new GetTeacherProfileQuery { UserName = row.UserName });
                        await itemDispatcher.Execute<GetTeacherAdvertisementQuery, TeacherAdvertisementQri>(
                            new GetTeacherAdvertisementQuery { UserName = row.UserName });
                        var books = await itemDispatcher.Execute<GetTeacherBooksQuery, List<TeacherBookPublicQri>>(
                            new GetTeacherBooksQuery { UserName = row.UserName });
                        foreach (var book in books.Data ?? [])
                        {
                            CollectMedia(mediaUrls, book.CoverImageUrl);
                            CollectMedia(mediaUrls, book.PdfFileUrl);
                            CollectMedia(mediaUrls, book.EpubFileUrl);
                            CollectMedia(mediaUrls, book.WordFileUrl);
                            CollectMedia(mediaUrls, book.BookFileUrl);
                        }
                    }
                    else if (row.TeacherId > 0)
                    {
                        var books = await itemDispatcher.Execute<GetTeacherBooksQuery, List<TeacherBookPublicQri>>(
                            new GetTeacherBooksQuery { TeacherId = row.TeacherId });
                        foreach (var book in books.Data ?? [])
                            CollectMedia(mediaUrls, book.CoverImageUrl);
                        await itemDispatcher.Execute<GetTeacherAdvertisementQuery, TeacherAdvertisementQri>(
                            new GetTeacherAdvertisementQuery { TeacherId = row.TeacherId });
                    }
                });
            }),
        ];
    }

    private async Task ProbeMediaHeadsAsync(
        HashSet<string> mediaUrls,
        CacheWarmupProgress progress,
        CancellationToken cancellationToken)
    {
        if (mediaUrls.Count == 0)
            return;

        var client = httpClientFactory.CreateClient("cache-warmup");
        client.Timeout = TimeSpan.FromSeconds(6);
        var publicBase = (fileStorageOptions.Value.PublicBaseUrl ?? "https://msg.arkasoftware.ir").TrimEnd('/');

        var urls = mediaUrls
            .Select(u => ResolvePublicUrl(u, publicBase))
            .Where(u => !string.IsNullOrWhiteSpace(u))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(MediaHeadSampleSize)
            .ToList();

        if (urls.Count == 0)
            return;

        var ok = 0;
        var fail = 0;
        using var gate = new SemaphoreSlim(6);
        await Task.WhenAll(urls.Select(async url =>
        {
            await gate.WaitAsync(cancellationToken);
            try
            {
                using var request = new HttpRequestMessage(HttpMethod.Head, url);
                using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
                if (response.IsSuccessStatusCode)
                    Interlocked.Increment(ref ok);
                else
                    Interlocked.Increment(ref fail);
            }
            catch
            {
                Interlocked.Increment(ref fail);
            }
            finally
            {
                gate.Release();
                progress.CurrentStep = $"cache_warmup_step_media_check:{ok + fail}:{urls.Count}";
                Touch(progress);
            }
        }));

        if (fail > 0)
        {
            logger.LogWarning(
                "Cache warmup media HEAD check: {Ok} ok, {Fail} failed (sample {Sample}). Verify msg DNS points only to the download host.",
                ok, fail, urls.Count);
            progress.Error = string.IsNullOrWhiteSpace(progress.Error)
                ? $"Media check: {fail}/{urls.Count} URLs failed on download host."
                : progress.Error + $" | Media check: {fail}/{urls.Count} failed.";
        }
    }

    /// <summary>
    /// Runs <paramref name="action"/> over items with bounded parallelism.
    /// Each item gets its OWN DI scope so the scoped ArkaSoftwareQueryDbContext is never
    /// shared between concurrent operations (a single scope here caused
    /// "A second operation was started on this context instance" errors).
    /// </summary>
    private static async Task ForEachAsync<T>(
        IServiceScopeFactory scopeFactory,
        IReadOnlyList<T> items,
        int concurrency,
        CancellationToken cancellationToken,
        Func<IQueryDispatcher, T, Task> action)
    {
        if (items.Count == 0)
            return;

        using var gate = new SemaphoreSlim(Math.Max(1, concurrency));
        var tasks = items.Select(async item =>
        {
            await gate.WaitAsync(cancellationToken);
            try
            {
                cancellationToken.ThrowIfCancellationRequested();
                await using var scope = scopeFactory.CreateAsyncScope();
                var dispatcher = scope.ServiceProvider.GetRequiredService<IQueryDispatcher>();
                await action(dispatcher, item);
            }
            finally
            {
                gate.Release();
            }
        });
        await Task.WhenAll(tasks);
    }

    private static void CollectMedia(HashSet<string> bag, string? path)
    {
        if (!string.IsNullOrWhiteSpace(path))
            bag.Add(path.Trim());
    }

    private static string? ResolvePublicUrl(string path, string publicBase)
    {
        var value = path.Trim();
        if (value.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
            || value.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var uri = new Uri(value);
                var host = uri.Host.ToLowerInvariant();
                if (host is "msg.arkasoftware.ir" || host.StartsWith("msg.")
                    || host is "api.arkasoftware.ir" || host.StartsWith("api.")
                    || host.EndsWith(".arkasoftware.ir"))
                {
                    value = uri.AbsolutePath;
                }
                else
                {
                    return value;
                }
            }
            catch
            {
                return value;
            }
        }

        if (value.StartsWith("//"))
            return "https:" + value;

        if (!value.StartsWith('/'))
            value = "/" + value;

        if (!value.StartsWith("/public/", StringComparison.OrdinalIgnoreCase)
            && !value.StartsWith("/private/", StringComparison.OrdinalIgnoreCase)
            && !value.StartsWith("/drm/", StringComparison.OrdinalIgnoreCase)
            && (value.StartsWith("/images/", StringComparison.OrdinalIgnoreCase)
                || value.StartsWith("/videos/", StringComparison.OrdinalIgnoreCase)
                || value.StartsWith("/seminars/", StringComparison.OrdinalIgnoreCase)
                || value.StartsWith("/rooms/", StringComparison.OrdinalIgnoreCase)
                || value.StartsWith("/users/", StringComparison.OrdinalIgnoreCase)
                || value.StartsWith("/projects/", StringComparison.OrdinalIgnoreCase)
                || value.StartsWith("/files/", StringComparison.OrdinalIgnoreCase)
                || value.StartsWith("/media/", StringComparison.OrdinalIgnoreCase)
                || value.StartsWith("/audio/", StringComparison.OrdinalIgnoreCase)))
        {
            value = "/public" + value;
        }

        return publicBase.TrimEnd('/') + value;
    }

    private static int PercentFor(int completed, int total)
        => (int)Math.Round(100.0 * Math.Clamp(completed, 0, total) / Math.Max(1, total));

    private static void SetStep(CacheWarmupProgress progress, string step, int percent)
    {
        progress.CurrentStep = step;
        progress.Percent = Math.Clamp(percent, 0, 99);
        Touch(progress);
    }

    private static void Touch(CacheWarmupProgress progress)
        => progress.UpdatedAtUtc = DateTimeOffset.UtcNow;

    private static CacheWarmupProgress Clone(CacheWarmupProgress source) => new()
    {
        JobId = source.JobId,
        Status = source.Status,
        Percent = source.Percent,
        CompletedItems = source.CompletedItems,
        TotalItems = source.TotalItems,
        CurrentStep = source.CurrentStep,
        Error = source.Error,
        StartedAtUtc = source.StartedAtUtc,
        FinishedAtUtc = source.FinishedAtUtc,
        UpdatedAtUtc = source.UpdatedAtUtc,
    };
}
