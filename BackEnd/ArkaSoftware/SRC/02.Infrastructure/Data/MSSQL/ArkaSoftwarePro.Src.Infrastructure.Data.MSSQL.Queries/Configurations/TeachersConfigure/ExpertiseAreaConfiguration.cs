using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Teachers;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.TeachersConfigure;

public class ExpertiseAreaConfiguration : IEntityTypeConfiguration<ExpertiseAreaQueryModel>
{
    public void Configure(EntityTypeBuilder<ExpertiseAreaQueryModel> builder)
    {
        builder.ToTable("ExpertiseAreas", "Teacher");
        builder.HasKey(x => x.Id).HasName("Id");

        builder.Property(x => x.Id)
            .HasColumnType("BIGINT")
            .HasColumnName("Id").IsRequired();


        builder.Property(x => x.Name)
            .HasColumnType("NVARCHAR")
            .HasColumnName("Name")
            .HasMaxLength(400);

        builder.Property(x => x.Rate)
            .HasColumnType("INT")
            .HasColumnName("Rate");

        builder.HasOne(x => x.Teacher)
            .WithMany(x => x.ExpertiseAreas)
            .HasForeignKey(x => x.TeacherId);
    }
}