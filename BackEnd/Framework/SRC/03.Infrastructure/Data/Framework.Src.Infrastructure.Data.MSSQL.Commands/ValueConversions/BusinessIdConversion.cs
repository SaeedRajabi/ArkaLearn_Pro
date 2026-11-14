using Framework.Src.Core.Domain.ValueOBJs;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Framework.Src.Infrastructure.Data.MSSQL.Commands.ValueConversions
{
    public class BusinessIdConversion : ValueConverter<BusinessID, Guid>
    {
        public BusinessIdConversion() : base(c => c.Value, c => BusinessID.FromGuid(c))
        {

        }
    }
}
