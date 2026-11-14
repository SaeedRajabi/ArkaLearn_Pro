using ArkaSoftwarePro.Src.Core.Domain.StudentAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.StudentsConfigure
{
    public class StudentsConfiguration : IEntityTypeConfiguration<Student>
    {
        public void Configure(EntityTypeBuilder<Student> builder)
        {
            builder.ToTable("Students", "Student");

            builder.HasOne(x => x.User).WithOne().HasForeignKey<Student>(x => x.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            builder.Property(x => x.HeaderImageUrl).HasMaxLength(2000);
        }
    }
}
