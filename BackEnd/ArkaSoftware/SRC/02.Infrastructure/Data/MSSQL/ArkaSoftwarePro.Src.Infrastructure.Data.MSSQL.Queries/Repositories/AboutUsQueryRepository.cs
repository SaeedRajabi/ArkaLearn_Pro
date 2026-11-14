using ArkaSoftwarePro.Src.Core.Contracts.AboutUs.AboutUsRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.AboutUs.Queries.GetAboutUs;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories
{
    public class AboutUsQueryRepository(ArkaSoftwareQueryDbContext dbContext)
        : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext), IAboutUsQueryRepository
    {
        public async Task<AboutUsQri?> GetAboutUsExecuteAsync(GetAboutUsQuery query)
        {
            var result = await _dbContext.AboutUsPages
                .AsNoTracking()
                .Include(x => x.TeamMembers)
                .OrderByDescending(x => x.Id)
                .Select(x => new AboutUsQri
                {
                    Id = x.Id,
                    HeroTitle = x.HeroTitle,
                    HeroSubtitle = x.HeroSubtitle,
                    HeroImageUrl = x.HeroImageUrl,
                    IntroTitle = x.IntroTitle,
                    IntroContentHtml = x.IntroContentHtml,
                    MissionTitle = x.MissionTitle,
                    MissionContentHtml = x.MissionContentHtml,
                    VisionTitle = x.VisionTitle,
                    VisionContentHtml = x.VisionContentHtml,
                    ValuesTitle = x.ValuesTitle,
                    ValuesContentHtml = x.ValuesContentHtml,
                    TeamTitle = x.TeamTitle,
                    TeamContentHtml = x.TeamContentHtml,
                    TeamImageUrl = x.TeamImageUrl,
                    CtaTitle = x.CtaTitle,
                    CtaSubtitle = x.CtaSubtitle,
                    CtaButtonText = x.CtaButtonText,
                    CtaButtonUrl = x.CtaButtonUrl,
                    TeamMembers = x.TeamMembers
                        .OrderBy(member => member.DisplayOrder)
                        .ThenBy(member => member.Id)
                        .Select(member => new AboutUsTeamMemberQri
                        {
                            Id = member.Id,
                            FullName = member.FullName,
                            SkillTitle = member.SkillTitle,
                            ImageUrl = member.ImageUrl,
                            GithubUrl = member.GithubUrl,
                            LinkedinUrl = member.LinkedinUrl,
                            TwitterUrl = member.TwitterUrl,
                            InstagramUrl = member.InstagramUrl,
                            WebsiteUrl = member.WebsiteUrl,
                            DisplayOrder = member.DisplayOrder
                        })
                        .ToList(),
                    LastModifiedAt = x.ModifiedDateTime ?? x.CreatedDateTime
                })
                .FirstOrDefaultAsync();

            return result;
        }
    }
}
