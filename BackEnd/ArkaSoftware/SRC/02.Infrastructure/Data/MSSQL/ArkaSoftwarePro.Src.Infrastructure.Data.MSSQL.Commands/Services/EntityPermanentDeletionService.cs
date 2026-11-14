using ArkaSoftwarePro.Src.Core.Contracts.Services;
using ArkaSoftwarePro.Src.Core.Domain.ArticleAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.SeminarAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Services;

public class EntityPermanentDeletionService(ArkaSoftwareCommandDbContext dbContext) : IEntityPermanentDeletionService
{
    public async Task<bool> PermanentlyDeleteArticleAsync(long articleId, CancellationToken cancellationToken = default)
    {
        var exists = await dbContext.Articles.AnyAsync(a => a.Id == articleId, cancellationToken);
        if (!exists)
            return false;

        await dbContext.FavoriteArticles.Where(x => x.ArticleId == articleId).ExecuteDeleteAsync(cancellationToken);
        await dbContext.Set<ArticleReaction>().Where(x => x.ArticleId == articleId).ExecuteDeleteAsync(cancellationToken);
        await dbContext.Set<ArticleComment>().Where(x => x.ArticleId == articleId).ExecuteDeleteAsync(cancellationToken);
        await ClearTagOwnerAsync("ArticleId", articleId, cancellationToken);
        await dbContext.Articles.Where(a => a.Id == articleId).ExecuteDeleteAsync(cancellationToken);
        return true;
    }

    public async Task<bool> PermanentlyDeleteSeminarAsync(long seminarId, CancellationToken cancellationToken = default)
    {
        var exists = await dbContext.Seminars.AnyAsync(s => s.Id == seminarId, cancellationToken);
        if (!exists)
            return false;

        await dbContext.FavoriteSeminars.Where(x => x.SeminarId == seminarId).ExecuteDeleteAsync(cancellationToken);
        await dbContext.Set<SeminarRegistration>().Where(x => x.SeminarId == seminarId).ExecuteDeleteAsync(cancellationToken);
        await dbContext.Set<SeminarComment>().Where(x => x.SeminarId == seminarId).ExecuteDeleteAsync(cancellationToken);
        await ClearTagOwnerAsync("SeminarId", seminarId, cancellationToken);
        await dbContext.Seminars.Where(s => s.Id == seminarId).ExecuteDeleteAsync(cancellationToken);
        return true;
    }

    public async Task<bool> PermanentlyDeleteCourseAsync(long courseId, CancellationToken cancellationToken = default)
    {
        var course = await dbContext.Courses.FirstOrDefaultAsync(c => c.Id == courseId, cancellationToken);
        if (course == null)
            return false;

        await dbContext.FavoriteCourses.Where(x => x.CourseId == courseId).ExecuteDeleteAsync(cancellationToken);
        await dbContext.Set<Core.Domain.BasketAggregate.Entities.BasketItem>()
            .Where(x => x.CourseId == courseId)
            .ExecuteDeleteAsync(cancellationToken);
        await dbContext.Set<Core.Domain.OrderAggregate.Entities.OrderItem>()
            .Where(x => x.CourseId == courseId)
            .ExecuteDeleteAsync(cancellationToken);

        await ClearTagOwnerAsync("CourseId", courseId, cancellationToken);
        dbContext.Courses.Remove(course);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> PermanentlyDeleteRoomAsync(long roomId, CancellationToken cancellationToken = default)
    {
        var exists = await dbContext.Rooms.AnyAsync(r => r.Id == roomId, cancellationToken);
        if (!exists)
            return false;

        var linkedSeminars = await dbContext.Seminars.Where(s => s.RoomId == roomId).ToListAsync(cancellationToken);
        foreach (var seminar in linkedSeminars)
            seminar.SetRoom(null);
        if (linkedSeminars.Count > 0)
            await dbContext.SaveChangesAsync(cancellationToken);

        await dbContext.RoomSessions.Where(s => s.RoomId == roomId).ExecuteDeleteAsync(cancellationToken);
        await dbContext.Set<Chat>().Where(c => c.RoomId == roomId).ExecuteDeleteAsync(cancellationToken);
        await dbContext.Rooms.Where(r => r.Id == roomId).ExecuteDeleteAsync(cancellationToken);
        return true;
    }

    public async Task<bool> PermanentlyDeleteCategoryAsync(long categoryId, CancellationToken cancellationToken = default)
    {
        var exists = await dbContext.Categories.AnyAsync(c => c.Id == categoryId, cancellationToken);
        if (!exists)
            return false;

        var childIds = await dbContext.Categories
            .Where(c => c.ParentId == categoryId)
            .Select(c => c.Id)
            .ToListAsync(cancellationToken);

        foreach (var childId in childIds)
            await PermanentlyDeleteCategoryAsync(childId, cancellationToken);

        await dbContext.Courses.Where(c => c.CategoryId == categoryId)
            .ExecuteUpdateAsync(c => c.SetProperty(x => x.CategoryId, (long?)null), cancellationToken);

        await dbContext.Articles.Where(a => a.CategoryId == categoryId)
            .ExecuteUpdateAsync(a => a.SetProperty(x => x.CategoryId, (long?)null), cancellationToken);

        await dbContext.Set<TeacherBook>().Where(b => b.CategoryId == categoryId)
            .ExecuteUpdateAsync(b => b.SetProperty(x => x.CategoryId, (long?)null), cancellationToken);

        await dbContext.Categories.Where(c => c.Id == categoryId).ExecuteDeleteAsync(cancellationToken);
        return true;
    }

    public async Task<bool> PermanentlyDeleteProjectAsync(long projectId, CancellationToken cancellationToken = default)
    {
        var exists = await dbContext.Projects.AnyAsync(p => p.Id == projectId, cancellationToken);
        if (!exists)
            return false;

        await ClearTagOwnerAsync("ProjectId", projectId, cancellationToken);
        await dbContext.Projects.Where(p => p.Id == projectId).ExecuteDeleteAsync(cancellationToken);
        return true;
    }

    private async Task ClearTagOwnerAsync(string ownerProperty, long ownerId, CancellationToken cancellationToken)
    {
        var tags = await dbContext.Tags
            .Where(t => EF.Property<long?>(t, ownerProperty) == ownerId)
            .ToListAsync(cancellationToken);

        foreach (var tag in tags)
            dbContext.Entry(tag).Property(ownerProperty).CurrentValue = null;

        if (tags.Count > 0)
            await dbContext.SaveChangesAsync(cancellationToken);
    }
}
