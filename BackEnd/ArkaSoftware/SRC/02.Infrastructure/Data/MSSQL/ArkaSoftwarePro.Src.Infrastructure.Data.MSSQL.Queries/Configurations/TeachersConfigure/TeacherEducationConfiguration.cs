using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Teachers;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.TeachersConfigure;

public class TeacherEducationConfiguration : IEntityTypeConfiguration<TeacherEducationQueryModel>
{
    public void Configure(EntityTypeBuilder<TeacherEducationQueryModel> builder)
    {
        builder.ToTable("TeacherEducations", "Teacher");
        builder.HasKey(x => x.Id).HasName("Id");

        builder.Property(x => x.Id)
            .HasColumnType("BIGINT")
            .HasColumnName("Id").IsRequired();


        builder.Property(x => x.TypeOfDegree)
            .HasColumnType("VARCHAR")
            .HasColumnName("TypeOfDegree")
            .HasMaxLength(50);

        builder.Property(x => x.NameOfInstitutionOrUniversity)
            .HasColumnType("NVARCHAR")
            .HasColumnName("NameOfInstitutionOrUniversity")
            .HasMaxLength(500);

        builder.Property(x => x.DegreeImage)
            .HasColumnType("NVARCHAR")
            .HasColumnName("DegreeImage")
            .HasMaxLength(4000);

        builder.HasOne(x => x.Teacher)
            .WithMany(x => x.TeacherEducations)
            .HasForeignKey(x => x.TeacherId);
    }
}