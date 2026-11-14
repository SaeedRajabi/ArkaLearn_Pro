using ArkaSoftwarePro.Src.Core.Domain.StudentAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.StudentsConfigure
{
    public class EducationalProfilesConfiguration : IEntityTypeConfiguration<EducationalProfile>
    {
        public void Configure(EntityTypeBuilder<EducationalProfile> builder)
        {
            builder.ToTable("EducationalProfiles", "Student");


        }
    }
}
