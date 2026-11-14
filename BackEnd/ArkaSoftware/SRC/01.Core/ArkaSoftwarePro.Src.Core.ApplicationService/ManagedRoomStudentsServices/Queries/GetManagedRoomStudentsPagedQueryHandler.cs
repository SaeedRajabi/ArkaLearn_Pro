using ArkaSoftwarePro.Src.Core.Contracts.ManagedRoomStudents.ManagedRoomStudentRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.ManagedRoomStudents.Queries.GetManagedRoomStudentsPaged;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ManagedRoomStudentsServices.Queries;

public class GetManagedRoomStudentsPagedQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IManagedRoomStudentQueryRepository repository)
    : QueryHandler<GetManagedRoomStudentsPagedQuery, PagedData<GetManagedRoomStudentsPagedQri>>(outer)
{
    public override async Task<QueryResult<PagedData<GetManagedRoomStudentsPagedQri>>> Handle(
        GetManagedRoomStudentsPagedQuery query)
    {
        try
        {
            var data = await repository.SearchPagedAsync(query);
            if (data == null)
                return await ResultAsync(null!, ApplicationServiceStatus.NotFound);
            return await ResultAsync(data, ApplicationServiceStatus.Ok);
        }
        catch
        {
            return await ResultAsync(null!, ApplicationServiceStatus.Exception);
        }
    }
}
