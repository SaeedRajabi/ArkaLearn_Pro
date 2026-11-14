using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.UnitOfWorksContracts;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.UnitOfWorks
{
    public class CourseUnitOfWork(ArkaSoftwareCommandDbContext dbContext)
        : BaseEntityFrameworkUnitOfWork<ArkaSoftwareCommandDbContext>(dbContext), ICourseUnitOfWork;
}
