using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.ValueOBJs;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.TeachersConfigure
{
    public class TeacherEducationConfiguration : IEntityTypeConfiguration<TeacherEducation>
    {
        public void Configure(EntityTypeBuilder<TeacherEducation> builder)
        {
            builder.ToTable("TeacherEducations", "Teacher");

            builder.Property(x => x.NameOfInstitutionOrUniversity)
                .HasConversion(x => x!.Value , x => new NameOfUniversity(x!))
                .HasColumnType("NVARCHAR")
                .HasMaxLength(500);


            builder.Property(x => x.TypeOfDegree).HasColumnType("VARCHAR")
                .HasMaxLength(50);

            builder.HasIndex(x => new { x.TeacherId, x.NameOfInstitutionOrUniversity, x.TypeOfDegree }).IsUnique();

            builder.HasOne(x => x.Teacher).WithMany(x => x.TeacherEducations)
                .HasForeignKey(x => x.TeacherId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
