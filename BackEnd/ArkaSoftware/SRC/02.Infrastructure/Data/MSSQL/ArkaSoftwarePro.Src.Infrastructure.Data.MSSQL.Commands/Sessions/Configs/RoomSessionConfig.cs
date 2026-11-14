using ArkaSoftwarePro.Src.Core.Domain.SessionAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Sessions.Configs;

public class RoomSessionConfig : IEntityTypeConfiguration<RoomSession>
{
    public void Configure(EntityTypeBuilder<RoomSession> builder)
    {
        builder.ToTable("RoomSessions");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.RoomId).IsRequired();
        builder.Property(x => x.StartTime).IsRequired();
        builder.Property(x => x.EndTime).IsRequired(false);
        builder.Property(x => x.Status).HasMaxLength(50).IsRequired();
        builder.Property(x => x.StartedByUserId).HasMaxLength(100).IsRequired(false);
        builder.Property(x => x.IsIgnored).HasDefaultValue(false);

        builder.Ignore(x => x.Duration);
    }
}