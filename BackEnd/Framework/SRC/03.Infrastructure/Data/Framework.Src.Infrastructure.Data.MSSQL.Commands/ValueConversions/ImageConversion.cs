using Framework.Src.Core.Domain.ValueOBJs;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Framework.Src.Infrastructure.Data.MSSQL.Commands.ValueConversions
{
    public class ImageConversion : ValueConverter<Image, string>
    {
        public ImageConversion() : base(x => x.ImageURL!, x => Image.FromString(x))
        {

        }
    }
}
