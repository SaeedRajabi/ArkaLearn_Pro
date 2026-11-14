using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Students;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.StudentConfigure
{
    public class StudentConfiguration:IEntityTypeConfiguration<StudentQueryModel>
    {
        public void Configure(EntityTypeBuilder<StudentQueryModel> builder)
        {
            builder.ToTable("Students", "Student");
            builder.HasKey(x => x.StudentId).HasName("Id");
            builder.Property(x => x.StudentId).HasColumnName("Id").HasColumnType("BIGINT");
            builder.Property(x => x.UserId).HasColumnName("UserId").HasColumnType("BIGINT");
            builder.Property(x => x.HeaderImageUrl).HasColumnName("HeaderImageUrl").HasMaxLength(2000);
            builder.HasOne(x => x.User).WithOne(x => x.Student).HasForeignKey<StudentQueryModel>(x => x.StudentId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(x => x.Orders).WithOne(x => x.Student).HasForeignKey(x => x.StudentId)
                .OnDelete(DeleteBehavior.Cascade).HasConstraintName("FK_Students_Users_UserId");
        }
    }
}
