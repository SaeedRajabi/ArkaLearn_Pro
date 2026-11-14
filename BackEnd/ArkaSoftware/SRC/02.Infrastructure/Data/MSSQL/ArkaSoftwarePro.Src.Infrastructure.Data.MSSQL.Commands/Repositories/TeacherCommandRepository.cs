using System.Net;
using System.Text.RegularExpressions;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate;
using ArkaSoftwarePro.Src.Core.Domain.SoftwareAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.ArticleAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetPendingTeacherContent;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.SearchTeacherAdvertisements;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.SearchTeacherBooks;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherBooks;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public class TeacherCommandRepository(ArkaSoftwareCommandDbContext dbContext)
    : BaseCommandRepository<Teacher, ArkaSoftwareCommandDbContext>(dbContext), ITeacherCommandRepository
{
    public async Task<Teacher?> GetByUserIdWithDetailsAsync(long userId, CancellationToken cancellationToken = default)
    {
        return await QueryWithDetails()
            .FirstOrDefaultAsync(t => t.UserId == userId, cancellationToken);
    }

    public async Task<Teacher?> GetByIdWithDetailsAsync(long teacherId, CancellationToken cancellationToken = default)
    {
        return await QueryWithDetails()
            .FirstOrDefaultAsync(t => t.Id == teacherId, cancellationToken);
    }

    public async Task<TeacherAdvertisement?> GetAdvertisementByUserIdAsync(long userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Set<TeacherAdvertisement>()
            .AsNoTracking()
            .Include(a => a.Teacher!)
                .ThenInclude(t => t!.User)
            .Where(a => !a.IsDelete && a.Teacher != null && a.Teacher.UserId == userId)
            .FirstOrDefaultAsync(cancellationToken);
    }

    private IQueryable<Teacher> QueryWithDetails()
    {
        return _dbContext.Set<Teacher>()
            .Include(t => t.User)
            .Include(t => t.TeacherEducations)
            .Include(t => t.TeacherExpertiseAreas)
            .Include(t => t.PromotionalVideos)
            .Include(t => t.Books)
                .ThenInclude(b => b.Category)
            .Include(t => t.PortfolioArticles)
            .Include(t => t.Advertisement)
            .Include(t => t.Resume)
            .Include(t => t.TeachingCategory);
    }

    public async Task<PagedData<TeacherAdvertisementListItemQri>> SearchPublicAdvertisementsAsync(
        SearchTeacherAdvertisementsQuery query,
        CancellationToken cancellationToken = default)
    {
        var pageNumber = query.PageNumber < 1 ? 1 : query.PageNumber;
        var pageSize = query.PageSize is < 1 or > 50 ? 20 : query.PageSize;
        var search = query.Search?.Trim();
        var tag = query.Tag?.Trim();

        var adsQuery = _dbContext.Set<TeacherAdvertisement>()
            .AsNoTracking()
            .Where(a => a.IsPublic
                && !a.IsDelete
                && a.ApprovalStatus == TeacherApprovalStatus.Approved
                && a.Teacher != null
                && a.Teacher.AccountStatus == TeacherAccountStatus.Active)
            .Include(a => a.Teacher!)
                .ThenInclude(t => t!.User)
            .Include(a => a.Teacher!)
                .ThenInclude(t => t!.TeachingCategory)
            .Include(a => a.Teacher!)
                .ThenInclude(t => t!.TeacherExpertiseAreas)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(tag))
        {
            var tagToken = $"\"{tag.ToLowerInvariant()}\"";
            adsQuery = adsQuery.Where(a => a.TagsJson.ToLower().Contains(tagToken));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var expertiseTeacherIds = (await _dbContext.Set<TeacherExpertiseArea>()
                .AsNoTracking()
                .Select(e => new { e.TeacherId, Name = e.Name!.Value })
                .ToListAsync(cancellationToken))
                .Where(e => !string.IsNullOrWhiteSpace(e.Name) &&
                            e.Name.Contains(search, StringComparison.OrdinalIgnoreCase))
                .Select(e => e.TeacherId)
                .Distinct()
                .ToList();

            var publicAdUserIds = await _dbContext.Set<TeacherAdvertisement>()
                .AsNoTracking()
                .Where(a => a.IsPublic
                    && !a.IsDelete
                    && a.ApprovalStatus == TeacherApprovalStatus.Approved
                    && a.Teacher != null
                    && a.Teacher.AccountStatus == TeacherAccountStatus.Active
                    && a.Teacher.UserId != null)
                .Select(a => a.Teacher!.UserId!.Value)
                .Distinct()
                .ToListAsync(cancellationToken);

            var matchingUserIds = publicAdUserIds.Count == 0
                ? []
                : (await _dbContext.Users
                    .AsNoTracking()
                    .Where(u => publicAdUserIds.Contains(u.Id))
                    .Select(u => new
                    {
                        u.Id,
                        UserName = u.UserName!.Value,
                        FirstName = u.UserFullName.FirstName ?? string.Empty,
                        LastName = u.UserFullName.LastName ?? string.Empty,
                    })
                    .ToListAsync(cancellationToken))
                    .Where(u =>
                        $"{u.FirstName} {u.LastName}".Trim().Contains(search, StringComparison.OrdinalIgnoreCase) ||
                        u.UserName.Contains(search, StringComparison.OrdinalIgnoreCase))
                    .Select(u => u.Id)
                    .ToList();

            var teacherIdsByUser = matchingUserIds.Count == 0
                ? []
                : await _dbContext.Set<Teacher>()
                    .AsNoTracking()
                    .Where(t => t.UserId != null && matchingUserIds.Contains(t.UserId.Value))
                    .Select(t => t.Id)
                    .ToListAsync(cancellationToken);

            var matchingTeacherIds = expertiseTeacherIds
                .Concat(teacherIdsByUser)
                .Distinct()
                .ToHashSet();

            adsQuery = adsQuery.Where(a =>
                a.Title.Contains(search) ||
                (a.WorkExperience != null && a.WorkExperience.Contains(search)) ||
                (a.Teacher!.TeachingCategory != null && a.Teacher.TeachingCategory.Name.Contains(search)) ||
                matchingTeacherIds.Contains(a.TeacherId));
        }

        var total = await adsQuery.CountAsync(cancellationToken);
        var rows = await adsQuery
            .OrderByDescending(a => a.LastBumpedAtUtc ?? DateTime.MinValue)
            .ThenByDescending(a => a.ListingStarLevel)
            .ThenByDescending(a => a.Id)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var rowIds = rows.Select(r => r.Id).ToList();
        var createdDates = rowIds.Count == 0
            ? new Dictionary<long, DateTime?>()
            : await _dbContext.Set<TeacherAdvertisement>()
                .AsNoTracking()
                .Where(a => rowIds.Contains(a.Id))
                .Select(a => new { a.Id, Created = EF.Property<DateTime?>(a, "CreatedDateTime") })
                .ToDictionaryAsync(x => x.Id, x => x.Created, cancellationToken);

        var items = rows.Select(a =>
        {
            var expertise = a.Teacher?.TeacherExpertiseAreas?
                .Where(e => e.Name != null && !string.IsNullOrWhiteSpace(e.Name.Value))
                .Select(e => e.Name!.Value.Trim())
                .Distinct()
                .ToList() ?? [];

            var summarySource = !string.IsNullOrWhiteSpace(a.WorkExperience)
                ? a.WorkExperience
                : StripHtml(a.DescriptionHtml);

            return new TeacherAdvertisementListItemQri
            {
                Id = a.Id,
                TeacherId = a.TeacherId,
                UserId = a.Teacher?.UserId ?? 0,
                Title = a.Title,
                PrivateTeachingCost = a.PrivateTeachingCost,
                HourlyTeachingCost = a.HourlyTeachingCost,
                WorkExperience = a.WorkExperience,
                DescriptionHtml = a.DescriptionHtml,
                ShortSummary = Truncate(summarySource, 220),
                SubjectNames = expertise.Count > 0 ? string.Join("، ", expertise) : a.Teacher?.TeachingCategory?.Name,
                TeacherDisplayName = a.Teacher?.User?.UserFullName != null
                    ? (a.Teacher.User.UserFullName.FirstName + " " + a.Teacher.User.UserFullName.LastName).Trim()
                    : string.Empty,
                TeacherUserName = a.Teacher?.User?.UserName != null ? a.Teacher.User.UserName.Value : string.Empty,
                TeacherAvatarUrl = a.Teacher?.User?.ProfileImage?.ImageURL ?? string.Empty,
                TeachingCategoryName = a.Teacher?.TeachingCategory?.Name ?? string.Empty,
                MemberSinceUtc = createdDates.GetValueOrDefault(a.Id),
                ListingStarLevel = a.ListingStarLevel,
                LastBumpedAtUtc = a.LastBumpedAtUtc,
                Tags = a.GetTags().ToList(),
            };
        }).ToList();

        return new PagedData<TeacherAdvertisementListItemQri>
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = total,
            QueryResult = items,
        };
    }

    private static string StripHtml(string? html)
    {
        if (string.IsNullOrWhiteSpace(html))
            return string.Empty;
        return Regex.Replace(html, "<[^>]+>", " ").Replace("&nbsp;", " ").Trim();
    }

    private static string Truncate(string? text, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(text))
            return string.Empty;
        var normalized = Regex.Replace(text.Trim(), @"\s+", " ");
        return normalized.Length <= maxLength ? normalized : normalized[..maxLength].Trim() + "…";
    }

    public async Task<PagedData<TeacherBookListItemQri>> SearchPublicBooksAsync(
        SearchTeacherBooksQuery query,
        CancellationToken cancellationToken = default)
    {
        var pageNumber = query.PageNumber < 1 ? 1 : query.PageNumber;
        var pageSize = query.PageSize is < 1 or > 100 ? 24 : query.PageSize;
        var search = query.Search?.Trim();
        var tag = query.Tag?.Trim();
        var categoryId = query.CategoryId is > 0 ? query.CategoryId : null;

        var booksQuery = _dbContext.Set<TeacherBook>()
            .AsNoTracking()
            .Where(b => !b.IsDelete
                && b.ApprovalStatus == TeacherApprovalStatus.Approved
                && b.Teacher != null
                && b.Teacher.AccountStatus == TeacherAccountStatus.Active)
            .Include(b => b.Teacher!)
                .ThenInclude(t => t!.User)
            .Include(b => b.Teacher!)
                .ThenInclude(t => t!.Advertisement)
            .Include(b => b.Category)
            .AsQueryable();

        if (categoryId.HasValue)
            booksQuery = booksQuery.Where(b => b.CategoryId == categoryId.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            booksQuery = booksQuery.Where(b =>
                b.Title.Contains(search) ||
                b.Description.Contains(search) ||
                (b.Publisher != null && b.Publisher.Contains(search)) ||
                (b.Isbn != null && b.Isbn.Contains(search)));
        }

        var all = await booksQuery
            .OrderByDescending(b => b.PublicationYear)
            .ThenBy(b => b.SortOrder)
            .ThenByDescending(b => b.Id)
            .ToListAsync(cancellationToken);

        if (!string.IsNullOrWhiteSpace(tag))
        {
            all = all
                .Where(b => b.GetTags().Any(t => t.Contains(tag, StringComparison.OrdinalIgnoreCase)))
                .ToList();
        }

        var total = all.Count;
        var pageItems = all.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToList();
        var categoryLookup = await BookCategoryPathHelper.LoadLookupAsync(_dbContext.Categories, cancellationToken);

        var items = pageItems.Select(b =>
        {
            var teacher = b.Teacher!;
            var user = teacher.User;
            var displayName = user != null
                ? $"{user.UserFullName?.FirstName} {user.UserFullName?.LastName}".Trim()
                : string.Empty;
            return new TeacherBookListItemQri
            {
                Id = b.Id,
                TeacherId = teacher.Id,
                Title = b.Title,
                ShortDescription = b.Description,
                CoverImageUrl = b.CoverImageUrl,
                HasBookFile = b.HasAnyBookFile(),
                Publisher = b.Publisher,
                PublicationYear = b.PublicationYear,
                Isbn = b.Isbn,
                Slug = b.Slug,
                Tags = b.GetTags().ToList(),
                CategoryId = b.CategoryId,
                CategoryName = b.Category?.Title?.Value,
                CategoryPath = BookCategoryPathHelper.BuildPath(b.CategoryId, categoryLookup),
                TeacherDisplayName = string.IsNullOrWhiteSpace(displayName) ? user?.UserName?.Value : displayName,
                TeacherUserName = user?.UserName?.Value,
                TeacherAvatarUrl = user?.ProfileImage?.ImageURL,
            };
        }).ToList();

        return new PagedData<TeacherBookListItemQri>
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = total,
            QueryResult = items,
        };
    }

    public async Task<TeacherBookPublicQri?> GetAccessibleBookBySlugAsync(
        string slug,
        long? viewerUserId = null,
        CancellationToken cancellationToken = default)
    {
        var normalizedSlug = WebUtility.UrlDecode(slug?.Trim() ?? string.Empty);
        if (string.IsNullOrWhiteSpace(normalizedSlug))
            return null;

        var book = await _dbContext.Set<TeacherBook>()
            .AsNoTracking()
            .Include(b => b.Teacher!)
                .ThenInclude(t => t!.User)
            .Include(b => b.Teacher!)
                .ThenInclude(t => t!.Advertisement)
            .Include(b => b.Category)
            .FirstOrDefaultAsync(
                b => !b.IsDelete && b.Slug == normalizedSlug,
                cancellationToken);

        if (book?.Teacher == null)
            return null;

        var teacher = book.Teacher;
        var isOwner = viewerUserId is > 0 && teacher.UserId == viewerUserId;
        if (!IsBookPubliclyVisible(book) && !isOwner)
            return null;

        var categoryLookup = await BookCategoryPathHelper.LoadLookupAsync(_dbContext.Categories, cancellationToken);
        var result = MapBookToPublicQri(book, teacher);
        result.CategoryPath = BookCategoryPathHelper.BuildPath(book.CategoryId, categoryLookup);
        return result;
    }

    private static bool IsBookPubliclyVisible(TeacherBook book) =>
        book.ApprovalStatus == TeacherApprovalStatus.Approved
        && book.Teacher?.AccountStatus == TeacherAccountStatus.Active;

    private static string MapBookApprovalStatus(TeacherApprovalStatus status) => status switch
    {
        TeacherApprovalStatus.Pending => "pending",
        TeacherApprovalStatus.Approved => "approved",
        TeacherApprovalStatus.Rejected => "rejected",
        _ => "draft",
    };

    private static TeacherBookPublicQri MapBookToPublicQri(TeacherBook book, Teacher teacher)
    {
        var user = teacher.User;
        var displayName = user != null
            ? $"{user.UserFullName?.FirstName} {user.UserFullName?.LastName}".Trim()
            : string.Empty;

        return new TeacherBookPublicQri
        {
            Id = book.Id,
            TeacherId = teacher.Id,
            Title = book.Title,
            ShortDescription = book.Description,
            LongDescriptionHtml = book.LongDescriptionHtml,
            CoverImageUrl = book.CoverImageUrl,
            BookFileUrl = book.BookFileUrl,
            BookFileName = book.BookFileName,
            PdfFileUrl = book.PdfFileUrl,
            PdfFileName = book.PdfFileName,
            EpubFileUrl = book.EpubFileUrl,
            EpubFileName = book.EpubFileName,
            WordFileUrl = book.WordFileUrl,
            WordFileName = book.WordFileName,
            Publisher = book.Publisher,
            PublicationYear = book.PublicationYear,
            Isbn = book.Isbn,
            CategoryId = book.CategoryId,
            CategoryName = book.Category?.Title?.Value,
            Slug = book.Slug,
            Tags = book.GetTags().ToList(),
            ApprovalStatus = MapBookApprovalStatus(book.ApprovalStatus),
            SortOrder = book.SortOrder,
            TeacherDisplayName = string.IsNullOrWhiteSpace(displayName) ? user?.UserName?.Value : displayName,
            TeacherUserName = user?.UserName?.Value,
            TeacherAvatarUrl = user?.ProfileImage?.ImageURL,
        };
    }

    public async Task<AdvertisementMonetizationSettings> GetOrCreateMonetizationSettingsAsync(CancellationToken cancellationToken = default)
    {
        var settings = await _dbContext.Set<AdvertisementMonetizationSettings>()
            .FirstOrDefaultAsync(s => !s.IsDelete, cancellationToken);
        if (settings != null)
            return settings;

        settings = AdvertisementMonetizationSettings.CreateDefault();
        await _dbContext.Set<AdvertisementMonetizationSettings>().AddAsync(settings, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return settings;
    }

    public Task SaveMonetizationSettingsAsync(AdvertisementMonetizationSettings settings, CancellationToken cancellationToken = default)
    {
        var entry = _dbContext.Entry(settings);
        if (entry.State == EntityState.Detached)
            _dbContext.Set<AdvertisementMonetizationSettings>().Update(settings);
        return Task.CompletedTask;
    }

    public Task<List<AdvertisementTariff>> GetActiveTariffsAsync(CancellationToken cancellationToken = default)
        => _dbContext.Set<AdvertisementTariff>()
            .AsNoTracking()
            .Where(t => !t.IsDelete && t.IsActive)
            .OrderBy(t => t.DurationMonths)
            .ThenBy(t => t.StarLevel)
            .ToListAsync(cancellationToken);

    public Task<List<AdvertisementTariff>> GetAllTariffsAsync(CancellationToken cancellationToken = default)
        => _dbContext.Set<AdvertisementTariff>()
            .AsNoTracking()
            .Where(t => !t.IsDelete)
            .OrderBy(t => t.DurationMonths)
            .ThenBy(t => t.StarLevel)
            .ToListAsync(cancellationToken);

    public async Task EnsureDefaultTariffsAsync(CancellationToken cancellationToken = default)
    {
        var hasAny = await _dbContext.Set<AdvertisementTariff>().AnyAsync(t => !t.IsDelete, cancellationToken);
        if (hasAny) return;

        foreach (var (durationMonths, starLevel, priceToman, discountPercent) in AdvertisementMonetizationSeed.DefaultTariffs)
        {
            await _dbContext.Set<AdvertisementTariff>().AddAsync(
                AdvertisementTariff.Create(durationMonths, starLevel, priceToman, discountPercent),
                cancellationToken);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task EnsureDefaultAutoBumpPackagesAsync(CancellationToken cancellationToken = default)
    {
        var hasAny = await _dbContext.Set<AdvertisementAutoBumpPackage>().AnyAsync(p => !p.IsDelete, cancellationToken);
        if (hasAny) return;

        foreach (var (name, durationDays, priceToman) in AdvertisementMonetizationSeed.DefaultAutoBumpPackages)
        {
            await _dbContext.Set<AdvertisementAutoBumpPackage>().AddAsync(
                AdvertisementAutoBumpPackage.Create(name, durationDays, priceToman),
                cancellationToken);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task ReplaceTariffPricesAsync(
        IReadOnlyList<(long Id, long PriceToman, int DiscountPercent, bool IsActive)> updates,
        CancellationToken cancellationToken = default)
    {
        if (updates.Count == 0) return;

        foreach (var update in updates)
        {
            if (update.Id <= 0) continue;

            await _dbContext.Set<AdvertisementTariff>()
                .Where(t => t.Id == update.Id && !t.IsDelete)
                .ExecuteUpdateAsync(
                    setters => setters
                        .SetProperty(t => t.PriceToman, update.PriceToman)
                        .SetProperty(t => t.DiscountPercent, update.DiscountPercent)
                        .SetProperty(t => t.IsActive, update.IsActive),
                    cancellationToken);
        }
    }

    public Task<AdvertisementTariff?> GetTariffByIdAsync(long tariffId, CancellationToken cancellationToken = default)
        => _dbContext.Set<AdvertisementTariff>()
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == tariffId && !t.IsDelete && t.IsActive, cancellationToken);

    public Task<TeacherAdvertisementSubscription?> GetActiveSubscriptionAsync(long teacherId, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        return _dbContext.Set<TeacherAdvertisementSubscription>()
            .AsNoTracking()
            .Where(s => !s.IsDelete && s.TeacherId == teacherId && s.Status == AdvertisementSubscriptionStatus.Active && s.ExpiresAtUtc > now)
            .OrderByDescending(s => s.ExpiresAtUtc)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task AddSubscriptionAsync(TeacherAdvertisementSubscription subscription, CancellationToken cancellationToken = default)
    {
        await _dbContext.Set<TeacherAdvertisementSubscription>().AddAsync(subscription, cancellationToken);
    }

    public Task<TeacherAdvertisementContactUnlock?> GetValidContactUnlockAsync(long viewerUserId, long teacherId, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        return _dbContext.Set<TeacherAdvertisementContactUnlock>()
            .AsNoTracking()
            .Where(u => !u.IsDelete && u.ViewerUserId == viewerUserId && u.TeacherId == teacherId && u.ExpiresAtUtc > now)
            .OrderByDescending(u => u.ExpiresAtUtc)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task AddContactUnlockAsync(TeacherAdvertisementContactUnlock unlock, CancellationToken cancellationToken = default)
    {
        await _dbContext.Set<TeacherAdvertisementContactUnlock>().AddAsync(unlock, cancellationToken);
    }

    public Task<TeacherAdvertisement?> GetAdvertisementByTeacherIdAsync(long teacherId, CancellationToken cancellationToken = default)
        => _dbContext.Set<TeacherAdvertisement>()
            .FirstOrDefaultAsync(a => !a.IsDelete && a.TeacherId == teacherId, cancellationToken);

    public Task<List<AdvertisementAutoBumpPackage>> GetActiveAutoBumpPackagesAsync(CancellationToken cancellationToken = default)
        => _dbContext.Set<AdvertisementAutoBumpPackage>()
            .AsNoTracking()
            .Where(p => !p.IsDelete && p.IsActive)
            .OrderBy(p => p.DurationDays)
            .ToListAsync(cancellationToken);

    public Task<List<AdvertisementAutoBumpPackage>> GetAllAutoBumpPackagesAsync(CancellationToken cancellationToken = default)
        => _dbContext.Set<AdvertisementAutoBumpPackage>()
            .AsNoTracking()
            .Where(p => !p.IsDelete)
            .OrderBy(p => p.DurationDays)
            .ToListAsync(cancellationToken);

    public Task<AdvertisementAutoBumpPackage?> GetAutoBumpPackageByIdAsync(long packageId, CancellationToken cancellationToken = default)
        => _dbContext.Set<AdvertisementAutoBumpPackage>()
            .FirstOrDefaultAsync(p => p.Id == packageId && !p.IsDelete && p.IsActive, cancellationToken);

    public async Task ReplaceAutoBumpPackagePricesAsync(
        IReadOnlyList<(long Id, string Name, int DurationDays, long PriceToman, bool IsActive)> updates,
        CancellationToken cancellationToken = default)
    {
        if (updates.Count == 0) return;

        foreach (var update in updates)
        {
            if (update.Id <= 0)
            {
                var created = AdvertisementAutoBumpPackage.Create(
                    update.Name,
                    update.DurationDays,
                    update.PriceToman,
                    update.IsActive);
                await _dbContext.Set<AdvertisementAutoBumpPackage>().AddAsync(created, cancellationToken);
                continue;
            }

            await _dbContext.Set<AdvertisementAutoBumpPackage>()
                .Where(p => p.Id == update.Id && !p.IsDelete)
                .ExecuteUpdateAsync(
                    setters => setters
                        .SetProperty(p => p.Name, update.Name)
                        .SetProperty(p => p.DurationDays, update.DurationDays)
                        .SetProperty(p => p.PriceToman, update.PriceToman)
                        .SetProperty(p => p.IsActive, update.IsActive),
                    cancellationToken);
        }
    }

    public async Task AddAutoBumpPurchaseAsync(TeacherAdvertisementAutoBumpPurchase purchase, CancellationToken cancellationToken = default)
    {
        await _dbContext.Set<TeacherAdvertisementAutoBumpPurchase>().AddAsync(purchase, cancellationToken);
    }

    public Task<TeacherAdvertisementAutoBumpPurchase?> GetActiveAutoBumpPurchaseAsync(long teacherId, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        return _dbContext.Set<TeacherAdvertisementAutoBumpPurchase>()
            .AsNoTracking()
            .Where(p => !p.IsDelete && p.TeacherId == teacherId && p.ExpiresAtUtc > now)
            .OrderByDescending(p => p.ExpiresAtUtc)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task AddMonetizationRevenueAsync(AdvertisementMonetizationRevenue revenue, CancellationToken cancellationToken = default)
    {
        await _dbContext.Set<AdvertisementMonetizationRevenue>().AddAsync(revenue, cancellationToken);
    }

    public Task<bool> RevenueExistsByReferenceAsync(string paymentReference, CancellationToken cancellationToken = default)
        => _dbContext.Set<AdvertisementMonetizationRevenue>()
            .AsNoTracking()
            .AnyAsync(r => !r.IsDelete && r.PaymentReference == paymentReference, cancellationToken);

    public async Task<List<AdvertisementMonetizationRevenue>> GetMonetizationRevenuesAsync(
        DateTime? fromUtc,
        DateTime? toUtc,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Set<AdvertisementMonetizationRevenue>()
            .AsNoTracking()
            .Where(r => !r.IsDelete);

        if (fromUtc.HasValue)
            query = query.Where(r => r.OccurredAtUtc >= fromUtc.Value);
        if (toUtc.HasValue)
            query = query.Where(r => r.OccurredAtUtc <= toUtc.Value);

        return await query.OrderByDescending(r => r.OccurredAtUtc).ToListAsync(cancellationToken);
    }

    public async Task ProcessScheduledAutoBumpsAsync(CancellationToken cancellationToken = default)
    {
        var settings = await GetOrCreateMonetizationSettingsAsync(cancellationToken);
        var now = DateTime.UtcNow;
        var interval = TimeSpan.FromMinutes(settings.AutoBumpIntervalMinutes > 0 ? settings.AutoBumpIntervalMinutes : 60);

        var teacherIds = new HashSet<long>();

        var purchaseTeacherIds = await _dbContext.Set<TeacherAdvertisementAutoBumpPurchase>()
            .AsNoTracking()
            .Where(p => !p.IsDelete && p.ExpiresAtUtc > now)
            .Select(p => p.TeacherId)
            .Distinct()
            .ToListAsync(cancellationToken);
        foreach (var id in purchaseTeacherIds) teacherIds.Add(id);

        if (settings.SubscriptionIncludesAutoBump)
        {
            var subTeacherIds = await _dbContext.Set<TeacherAdvertisementSubscription>()
                .AsNoTracking()
                .Where(s => !s.IsDelete && s.Status == AdvertisementSubscriptionStatus.Active && s.ExpiresAtUtc > now)
                .Select(s => s.TeacherId)
                .Distinct()
                .ToListAsync(cancellationToken);
            foreach (var id in subTeacherIds) teacherIds.Add(id);
        }

        if (teacherIds.Count == 0) return;

        var ads = await _dbContext.Set<TeacherAdvertisement>()
            .Where(a => !a.IsDelete && a.IsPublic && teacherIds.Contains(a.TeacherId))
            .ToListAsync(cancellationToken);

        foreach (var ad in ads)
        {
            var lastBump = ad.LastBumpedAtUtc ?? DateTime.MinValue;
            if (now - lastBump < interval) continue;

            var starLevel = ad.ListingStarLevel;
            var sub = await GetActiveSubscriptionAsync(ad.TeacherId, cancellationToken);
            if (sub != null && sub.StarLevel > starLevel)
                starLevel = sub.StarLevel;

            ad.BumpListing(starLevel, now);

            var activePurchase = await _dbContext.Set<TeacherAdvertisementAutoBumpPurchase>()
                .Where(p => !p.IsDelete && p.TeacherId == ad.TeacherId && p.ExpiresAtUtc > now)
                .OrderByDescending(p => p.ExpiresAtUtc)
                .FirstOrDefaultAsync(cancellationToken);
            activePurchase?.MarkAutoBumpExecuted(now);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task AddXpEventAsync(TeacherExperiencePointEvent xpEvent, CancellationToken cancellationToken = default)
    {
        await _dbContext.Set<TeacherExperiencePointEvent>().AddAsync(xpEvent, cancellationToken);
    }

    public Task<List<TeacherExperiencePointEvent>> GetRecentXpEventsAsync(long teacherId, int take, CancellationToken cancellationToken = default)
    {
        var limit = take <= 0 ? 20 : Math.Min(take, 100);
        return _dbContext.Set<TeacherExperiencePointEvent>()
            .AsNoTracking()
            .Where(e => !e.IsDelete && e.TeacherId == teacherId)
            .OrderByDescending(e => e.OccurredAtUtc)
            .Take(limit)
            .ToListAsync(cancellationToken);
    }

    public Task<bool> HasPositiveXpEventAsync(
        long teacherId,
        TeacherXpEventReason reason,
        string? descriptionRef = null,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Set<TeacherExperiencePointEvent>()
            .AsNoTracking()
            .Where(e => !e.IsDelete && e.TeacherId == teacherId && e.Reason == reason && e.Amount > 0);

        if (!string.IsNullOrWhiteSpace(descriptionRef))
            query = query.Where(e => e.Description == descriptionRef);

        return query.AnyAsync(cancellationToken);
    }

    public Task<Teacher?> GetByPromotionalVideoIdAsync(long videoId, CancellationToken cancellationToken = default) =>
        QueryWithDetails()
            .FirstOrDefaultAsync(t => t.PromotionalVideos.Any(v => v.Id == videoId), cancellationToken);

    public Task<Teacher?> GetByBookIdAsync(long bookId, CancellationToken cancellationToken = default) =>
        QueryWithDetails()
            .FirstOrDefaultAsync(t => t.Books.Any(b => b.Id == bookId), cancellationToken);

    public Task<Teacher?> GetByPortfolioArticleIdAsync(long articleId, CancellationToken cancellationToken = default) =>
        QueryWithDetails()
            .FirstOrDefaultAsync(t => t.PortfolioArticles.Any(a => a.Id == articleId), cancellationToken);

    public async Task<List<PendingTeacherContentQri>> GetPendingContentAsync(CancellationToken cancellationToken = default)
    {
        var items = new List<PendingTeacherContentQri>();

        var pendingAds = await _dbContext.Set<TeacherAdvertisement>()
            .AsNoTracking()
            .Where(a => !a.IsDelete && a.ApprovalStatus == TeacherApprovalStatus.Pending)
            .Include(a => a.Teacher!)
                .ThenInclude(t => t!.User)
            .ToListAsync(cancellationToken);

        items.AddRange(pendingAds.Select(a => MapPending(
            "advertisement",
            a.TeacherId,
            a.Teacher,
            a.Title,
            BuildAdvertisementModerationSummary(a.WorkExperience, a.DescriptionHtml),
            a.SubmittedAtUtc)));

        var pendingVideos = await _dbContext.Set<TeacherPromotionalVideo>()
            .AsNoTracking()
            .Where(v => !v.IsDelete && v.ApprovalStatus == TeacherApprovalStatus.Pending)
            .Include(v => v.Teacher!)
                .ThenInclude(t => t!.User)
            .ToListAsync(cancellationToken);

        items.AddRange(pendingVideos.Select(v => MapPending(
            "video",
            v.Id,
            v.Teacher,
            v.Title,
            v.VideoUrl,
            v.SubmittedAtUtc,
            previewUrl: v.VideoUrl,
            thumbnailUrl: v.ThumbnailUrl)));

        var pendingBooks = await _dbContext.Set<TeacherBook>()
            .AsNoTracking()
            .Where(b => !b.IsDelete && b.ApprovalStatus == TeacherApprovalStatus.Pending)
            .Include(b => b.Teacher!)
                .ThenInclude(t => t!.User)
            .ToListAsync(cancellationToken);

        items.AddRange(pendingBooks.Select(b => MapPending(
            "book",
            b.Id,
            b.Teacher,
            b.Title,
            b.Description,
            b.SubmittedAtUtc,
            coverImageUrl: b.CoverImageUrl)));

        var pendingSoftware = await _dbContext.Set<SoftwareProduct>()
            .AsNoTracking()
            .Where(s => !s.IsDelete && s.TeacherId != null && s.ApprovalStatus == TeacherApprovalStatus.Pending)
            .Include(s => s.Teacher!)
                .ThenInclude(t => t!.User)
            .ToListAsync(cancellationToken);

        items.AddRange(pendingSoftware.Select(s => MapPending(
            "software",
            s.Id,
            s.Teacher,
            s.Title,
            s.Description,
            null)));

        var pendingPortfolio = await _dbContext.Set<TeacherPortfolioArticle>()
            .AsNoTracking()
            .Where(a => !a.IsDelete && a.ApprovalStatus == TeacherApprovalStatus.Pending)
            .Include(a => a.Teacher!)
                .ThenInclude(t => t!.User)
            .ToListAsync(cancellationToken);

        items.AddRange(pendingPortfolio.Select(a => MapPending(
            "portfolio_article",
            a.Id,
            a.Teacher,
            a.Title,
            a.Summary,
            null)));

        var pendingResumes = await _dbContext.Set<TeacherResume>()
            .AsNoTracking()
            .Where(r => !r.IsDelete && r.ApprovalStatus == TeacherApprovalStatus.Pending)
            .Include(r => r.Teacher!)
                .ThenInclude(t => t!.User)
            .ToListAsync(cancellationToken);

        items.AddRange(pendingResumes.Select(r => MapPending(
            "resume",
            r.TeacherId,
            r.Teacher,
            r.Title,
            r.Description,
            r.SubmittedAtUtc)));

        var pendingArticles = await _dbContext.Articles
            .AsNoTracking()
            .Where(a => !a.IsDelete && a.ModerationStatus == TeacherApprovalStatus.Pending)
            .ToListAsync(cancellationToken);

        foreach (var article in pendingArticles)
        {
            var teacher = await _dbContext.Set<Teacher>()
                .AsNoTracking()
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.UserId == article.AuthorUserId, cancellationToken);

            items.Add(MapPending(
                "article",
                article.Id,
                teacher,
                article.Title?.Value ?? string.Empty,
                article.Summary?.Value,
                article.ModerationSubmittedAtUtc));
        }

        return items
            .OrderByDescending(i => i.SubmittedAtUtc ?? DateTime.MinValue)
            .ToList();
    }

    private static string? BuildAdvertisementModerationSummary(string? workExperience, string descriptionHtml)
    {
        var parts = new List<string>();
        if (!string.IsNullOrWhiteSpace(workExperience))
            parts.Add(workExperience.Trim());

        var plainDescription = StripHtml(descriptionHtml);
        if (!string.IsNullOrWhiteSpace(plainDescription))
            parts.Add(plainDescription);

        if (parts.Count == 0)
            return null;

        var combined = string.Join("\n\n", parts);
        return combined.Length <= 1200 ? combined : combined[..1200] + "…";
    }

    public async Task<bool> IsUserFollowingTeacherAsync(long followerUserId, long teacherId, CancellationToken cancellationToken = default) =>
        await _dbContext.Set<TeacherFollow>()
            .AnyAsync(f => !f.IsDelete && f.FollowerUserId == followerUserId && f.TeacherId == teacherId, cancellationToken);

    public async Task AddTeacherFollowAsync(TeacherFollow follow, CancellationToken cancellationToken = default) =>
        await _dbContext.Set<TeacherFollow>().AddAsync(follow, cancellationToken);

    public async Task RemoveTeacherFollowAsync(long followerUserId, long teacherId, CancellationToken cancellationToken = default)
    {
        var follow = await _dbContext.Set<TeacherFollow>()
            .FirstOrDefaultAsync(f => !f.IsDelete && f.FollowerUserId == followerUserId && f.TeacherId == teacherId, cancellationToken);
        if (follow != null)
            _dbContext.Set<TeacherFollow>().Remove(follow);
    }

    public async Task<List<long>> GetTeacherFollowerUserIdsAsync(long teacherId, CancellationToken cancellationToken = default) =>
        await _dbContext.Set<TeacherFollow>()
            .AsNoTracking()
            .Where(f => !f.IsDelete && f.TeacherId == teacherId)
            .Select(f => f.FollowerUserId)
            .Distinct()
            .ToListAsync(cancellationToken);

    public async Task<int> GetTeacherFollowerCountAsync(long teacherId, CancellationToken cancellationToken = default) =>
        await _dbContext.Set<TeacherFollow>()
            .AsNoTracking()
            .CountAsync(f => !f.IsDelete && f.TeacherId == teacherId, cancellationToken);

    private static PendingTeacherContentQri MapPending(
        string contentType,
        long contentId,
        Teacher? teacher,
        string title,
        string? summary,
        DateTime? submittedAtUtc,
        string? previewUrl = null,
        string? thumbnailUrl = null,
        string? coverImageUrl = null)
    {
        var user = teacher?.User;
        var displayName = user != null
            ? $"{user.UserFullName?.FirstName} {user.UserFullName?.LastName}".Trim()
            : string.Empty;

        return new PendingTeacherContentQri
        {
            ContentType = contentType,
            ContentId = contentId,
            TeacherId = teacher?.Id ?? 0,
            UserId = teacher?.UserId,
            TeacherDisplayName = displayName,
            TeacherUserName = user?.UserName?.Value ?? string.Empty,
            Title = title,
            Summary = summary,
            PreviewUrl = previewUrl,
            ThumbnailUrl = thumbnailUrl,
            CoverImageUrl = coverImageUrl,
            SubmittedAtUtc = submittedAtUtc,
        };
    }

    public async Task<List<TeacherBookPublicQri>> GetAllBooksForAdminEditAsync(CancellationToken cancellationToken = default)
    {
        var books = await _dbContext.Set<TeacherBook>()
            .AsNoTracking()
            .Where(b => !b.IsDelete)
            .Include(b => b.Teacher!)
                .ThenInclude(t => t!.User)
            .Include(b => b.Category)
            .OrderBy(b => b.SortOrder)
            .ThenByDescending(b => b.Id)
            .ToListAsync(cancellationToken);

        return books.Select(b =>
        {
            var teacher = b.Teacher!;
            var user = teacher.User;
            var displayName = user != null
                ? $"{user.UserFullName?.FirstName} {user.UserFullName?.LastName}".Trim()
                : string.Empty;
            return new TeacherBookPublicQri
            {
                Id = b.Id,
                TeacherId = teacher.Id,
                Title = b.Title,
                ShortDescription = b.Description,
                LongDescriptionHtml = b.LongDescriptionHtml,
                CoverImageUrl = b.CoverImageUrl,
                BookFileUrl = b.BookFileUrl,
                BookFileName = b.BookFileName,
                PdfFileUrl = b.PdfFileUrl,
                PdfFileName = b.PdfFileName,
                EpubFileUrl = b.EpubFileUrl,
                EpubFileName = b.EpubFileName,
                WordFileUrl = b.WordFileUrl,
                WordFileName = b.WordFileName,
                Publisher = b.Publisher,
                PublicationYear = b.PublicationYear,
                Isbn = b.Isbn,
                CategoryId = b.CategoryId,
                CategoryName = b.Category?.Title?.Value,
                Slug = b.Slug,
                Tags = b.GetTags().ToList(),
                ApprovalStatus = MapBookApprovalStatus(b.ApprovalStatus),
                SortOrder = b.SortOrder,
                TeacherUserId = teacher.UserId,
                TeacherDisplayName = string.IsNullOrWhiteSpace(displayName) ? user?.UserName?.Value : displayName,
                TeacherUserName = user?.UserName?.Value,
                TeacherAvatarUrl = user?.ProfileImage?.ImageURL,
                SeoTitle = b.SeoTitle,
                MetaDescription = b.MetaDescription,
                OgImageUrl = b.OgImageUrl,
            };
        }).ToList();
    }
}
