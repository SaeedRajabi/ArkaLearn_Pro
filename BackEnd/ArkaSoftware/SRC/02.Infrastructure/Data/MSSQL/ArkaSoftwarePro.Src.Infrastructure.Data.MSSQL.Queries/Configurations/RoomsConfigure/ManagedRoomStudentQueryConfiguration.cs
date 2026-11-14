using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Rooms;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.RoomsConfigure;

public class ManagedRoomStudentQueryConfiguration : IEntityTypeConfiguration<ManagedRoomStudentQueryModel>
{
    public void Configure(EntityTypeBuilder<ManagedRoomStudentQueryModel> builder)
    {
        builder.ToTable("ManagedRoomStudents", "Room");
        builder.HasKey(x => x.Id);
    }
}
