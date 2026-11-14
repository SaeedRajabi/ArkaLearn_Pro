using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Seminars;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.SeminarsConfigure
{
    public class SeminarRegistrationConfiguration : IEntityTypeConfiguration<SeminarRegistrationQueryModel>
    {
        public void Configure(EntityTypeBuilder<SeminarRegistrationQueryModel> builder)
        {
            builder.ToTable("SeminarRegistrations", "Seminar");
            builder.HasKey(x => x.Id);
            builder.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        }
    }
}
