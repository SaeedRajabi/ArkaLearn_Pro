using ArkaSoftwarePro.Src.Core.Domain.SeminarAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.SeminarConfigure
{
    public class SeminarRegistrationConfiguration : IEntityTypeConfiguration<SeminarRegistration>
    {
        public void Configure(EntityTypeBuilder<SeminarRegistration> builder)
        {
            builder.ToTable("SeminarRegistrations", "Seminar");
            builder.Property(x => x.UserId).IsRequired();
            builder.Property(x => x.SeminarId).IsRequired();
            builder.Property(x => x.HasPaid).IsRequired();
            builder.Property(x => x.RegisteredAt).IsRequired();
            builder.HasIndex(x => new { x.SeminarId, x.UserId }).IsUnique();
        }
    }
}
