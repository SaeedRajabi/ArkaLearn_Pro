using Framework.Src.Core.Domain.ValueOBJs;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Framework.Src.Infrastructure.Data.MSSQL.Commands.ValueConversions
{
    public class PIdConversion : ValueConverter<PId, long>
    {
        public PIdConversion() : base(c => c.Value, c => PId.FromLong(c))
        {

        }
    }
}
