using ArkaSoftwarePro.Src.Core.Contracts.ContactUs.ContactUsRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.ContactUs.Queries.GetContactUs;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories
{
    public class ContactUsQueryRepository(ArkaSoftwareQueryDbContext dbContext)
        : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext), IContactUsQueryRepository
    {
        public async Task<ContactUsQri?> GetContactUsExecuteAsync(GetContactUsQuery query)
        {
            return await _dbContext.ContactUsPages
                .AsNoTracking()
                .OrderByDescending(x => x.Id)
                .Select(x => new ContactUsQri
                {
                    Id = x.Id,
                    PageTitle = x.PageTitle,
                    PageSubtitle = x.PageSubtitle,
                    HeroTitle = x.HeroTitle,
                    HeroSubtitle = x.HeroSubtitle,
                    HeadquartersTitle = x.HeadquartersTitle,
                    HeadquartersAddress = x.HeadquartersAddress,
                    HeadquartersPhone = x.HeadquartersPhone,
                    HeadquartersEmail = x.HeadquartersEmail,
                    ContactInfoTitle = x.ContactInfoTitle,
                    ContactInfoPhone = x.ContactInfoPhone,
                    ContactInfoEmail = x.ContactInfoEmail,
                    SalesSupportTitle = x.SalesSupportTitle,
                    SalesSupportPhone = x.SalesSupportPhone,
                    SalesSupportEmail = x.SalesSupportEmail,
                    FormTitle = x.FormTitle,
                    FormDescription = x.FormDescription,
                    MapEmbedUrl = x.MapEmbedUrl,
                    FacebookUrl = x.FacebookUrl,
                    TwitterUrl = x.TwitterUrl,
                    InstagramUrl = x.InstagramUrl,
                    LinkedInUrl = x.LinkedInUrl,
                    LastModifiedAt = x.ModifiedDateTime ?? x.CreatedDateTime
                })
                .FirstOrDefaultAsync();
        }
    }
}
