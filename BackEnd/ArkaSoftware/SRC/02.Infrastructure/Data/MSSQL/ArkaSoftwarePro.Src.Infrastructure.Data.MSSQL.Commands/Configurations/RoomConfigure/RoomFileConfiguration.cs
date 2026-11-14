using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Enumerations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.RoomConfigure
{
    public class RoomFileConfiguration : IEntityTypeConfiguration<RoomFile>
    {
        public void Configure(EntityTypeBuilder<RoomFile> builder)
        {
            builder.ToTable("RoomFiles", "Room");
            builder.Property(x => x.Title).HasMaxLength(200);
            builder.Property(x => x.Description).HasMaxLength(1000);
            builder.Property(x => x.FileName).HasMaxLength(256);
            builder.Property(x => x.FileUrl).HasMaxLength(2000);
            builder.Property(x => x.FileType).HasConversion<int>();
            builder.HasOne(x => x.Room).WithMany(x => x.RoomFiles).HasForeignKey(x => x.RoomId).OnDelete(DeleteBehavior.Cascade);
        }
    }
}
