using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherTeachingCategories;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Queries;

public class GetTeacherTeachingCategoriesQueryHandler(
    ArkaSoftwareCMPOutServices mafiaOuterService,
    ITeacherQueryRepository teacherQueryRepository)
    : QueryHandler<GetTeacherTeachingCategoriesQuery, List<TeacherTeachingCategoryItemQri>>(mafiaOuterService)
{
    public override async Task<QueryResult<List<TeacherTeachingCategoryItemQri>>> Handle(GetTeacherTeachingCategoriesQuery query)
    {
        var result = await teacherQueryRepository.GetTeachingCategoriesAsync();
        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }
}
