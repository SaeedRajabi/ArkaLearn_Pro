using ArkaSoftwarePro.Src.Core.Contracts.Users.Services;
using ArkaSoftwarePro.Src.Core.Domain.BasketAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.SeminarAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.StudentAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Users;

public class UserPortalAccountRemover(ArkaSoftwareCommandDbContext dbContext) : IUserPortalAccountRemover
{
    public async Task RemoveUserByIdAsync(long userId, CancellationToken cancellationToken = default)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user == null)
            return;

        await dbContext.FavoriteCourses.Where(x => x.UserId == user.Id).ExecuteDeleteAsync(cancellationToken);
        await dbContext.FavoriteArticles.Where(x => x.UserId == user.Id).ExecuteDeleteAsync(cancellationToken);
        await dbContext.FavoriteSeminars.Where(x => x.UserId == user.Id).ExecuteDeleteAsync(cancellationToken);
        await dbContext.Set<SeminarRegistration>().Where(r => r.UserId == user.Id).ExecuteDeleteAsync(cancellationToken);

        var userFiles = await dbContext.UserFiles.Where(f => f.UserId == user.Id).ToListAsync(cancellationToken);
        dbContext.UserFiles.RemoveRange(userFiles);

        var basket = await dbContext.Baskets
            .Include(b => b.Items)
            .FirstOrDefaultAsync(b => b.Id == user.Id, cancellationToken);
        if (basket != null)
            dbContext.Baskets.Remove(basket);

        var student = await dbContext.Students
            .Include(s => s.EducationalProfile)
            .Include(s => s.Orders)
            .FirstOrDefaultAsync(s => s.UserId == user.Id, cancellationToken);

        if (student != null)
        {
            var invoices = await dbContext.Invoices.Where(i => i.StudentId == student.Id).ToListAsync(cancellationToken);
            dbContext.Invoices.RemoveRange(invoices);

            var profileId = student.EducationalProfile?.Id;
            dbContext.Students.Remove(student);

            if (profileId is > 0)
            {
                var profile = await dbContext.Set<EducationalProfile>()
                    .FirstOrDefaultAsync(p => p.Id == profileId, cancellationToken);
                if (profile != null)
                    dbContext.Remove(profile);
            }
        }

        dbContext.Users.Remove(user);
    }
}
