using Framework.Src.Core.Domain.ValueOBJs;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Framework.Src.Infrastructure.Data.MSSQL.Commands.ValueConversions
{
    public class DescriptionConvention : ValueConverter<Description, string>
    {
        public DescriptionConvention() : base(c => c.Value, c => Description.FromString(c))
        {

        }
    }
}
