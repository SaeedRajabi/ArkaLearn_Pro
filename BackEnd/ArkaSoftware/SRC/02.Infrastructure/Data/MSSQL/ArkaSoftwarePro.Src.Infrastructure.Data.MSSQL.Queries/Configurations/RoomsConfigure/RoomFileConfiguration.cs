using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Rooms;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.RoomsConfigure
{
    public class RoomFileConfiguration : IEntityTypeConfiguration<RoomFileQueryModel>
    {
        public void Configure(EntityTypeBuilder<RoomFileQueryModel> builder)
        {
            builder.ToTable("RoomFiles", "Room");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.FileType).HasColumnType("INT");
            builder.Property(x => x.Title).HasMaxLength(200);
            builder.Property(x => x.Description).HasMaxLength(1000);
            builder.Property(x => x.FileName).HasMaxLength(256);
            builder.Property(x => x.FileUrl).HasMaxLength(2000);
        }
    }
}
