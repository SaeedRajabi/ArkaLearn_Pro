using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Sessions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.SessionsConfigure;

public class RoomSessionQueryModelConfiguration : IEntityTypeConfiguration<RoomSessionQueryModel>
{
    public void Configure(EntityTypeBuilder<RoomSessionQueryModel> builder)
    {
        builder.ToTable("RoomSessions");
        builder.HasKey(x => x.Id);
    }
}