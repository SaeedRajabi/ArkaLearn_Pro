using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Teachers;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.TeachersConfigure
{
    public class TeacherConfiguration:IEntityTypeConfiguration<TeacherQueryModel>
    {
        public void Configure(EntityTypeBuilder<TeacherQueryModel> builder)
        {
            builder.ToTable("Teachers", "Teacher");
            builder.HasKey(x => x.Id).HasName("Id");

            builder.Property(x => x.Id)
                .HasColumnType("BIGINT")
                .HasColumnName("Id").IsRequired();


            builder.Property(x => x.LongDescription)
                .HasColumnName("LongDescription")
                .HasColumnType("NVARCHAR")
                .HasMaxLength(4000);

            builder.Property(x => x.ShortDescription).HasMaxLength(500);
            builder.Property(x => x.HeaderImageUrl).HasMaxLength(2000);
            builder.Property(x => x.ProfileRejectionNote).HasMaxLength(2000);

            builder.HasOne(x => x.TeachingCategory)
                .WithMany()
                .HasForeignKey(x => x.TeachingCategoryId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(x => x.User)
                .WithOne(x => x.Teacher)
                .HasForeignKey<TeacherQueryModel>(x => x.UserId)
                .HasConstraintName("FK_Teachers_Users_UserId")
                .OnDelete(DeleteBehavior.Cascade);


            builder.HasMany(x => x.TeacherEducations)
                .WithOne(x => x.Teacher)
                .HasForeignKey(x => x.TeacherId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(x => x.ExpertiseAreas)
                .WithOne(x => x.Teacher)
                .HasForeignKey(x => x.TeacherId)
                .OnDelete(DeleteBehavior.Cascade);


            builder.HasMany(x => x.Courses)
                .WithOne(x => x.Teacher)
                .HasForeignKey(x => x.TeacherId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
