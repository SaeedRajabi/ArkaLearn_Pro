using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.SearchTeacherBooks;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Queries;

public class SearchTeacherBooksQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherCommandRepository teacherCommandRepository)
    : QueryHandler<SearchTeacherBooksQuery, PagedData<TeacherBookListItemQri>>(outer)
{
    public override async Task<QueryResult<PagedData<TeacherBookListItemQri>>> Handle(SearchTeacherBooksQuery query)
    {
        try
        {
            var result = await teacherCommandRepository.SearchPublicBooksAsync(query);
            return await ResultAsync(result, ApplicationServiceStatus.Ok);
        }
        catch (Exception)
        {
            return await ResultAsync(null!, ApplicationServiceStatus.Exception);
        }
    }
}
