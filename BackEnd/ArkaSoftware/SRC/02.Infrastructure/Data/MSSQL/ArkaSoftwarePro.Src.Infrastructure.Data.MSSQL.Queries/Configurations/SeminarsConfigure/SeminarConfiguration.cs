using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Seminars;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.SeminarsConfigure
{
    public class SeminarConfiguration : IEntityTypeConfiguration<SeminarQueryModel>
    {
        public void Configure(EntityTypeBuilder<SeminarQueryModel> builder)
        {
            builder.ToTable("Seminars", "Seminar");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.Title).HasMaxLength(200);
            builder.Property(x => x.Description);
            builder.Property(x => x.EntryLink).HasMaxLength(800);
            builder.Property(x => x.ThumbnailUrl).HasMaxLength(500);
            builder.Property(x => x.VideoUrl).HasMaxLength(500);
            builder.Property(x => x.RecordingVideoUrl).HasMaxLength(500);
            builder.Property(x => x.IsPublic);
            builder.Property(x => x.Prerequisites).HasMaxLength(4000);
            builder.Property(x => x.FaqsJson).HasMaxLength(4000);
            builder.HasOne(x => x.Room).WithMany().HasForeignKey(x => x.RoomId).OnDelete(DeleteBehavior.SetNull);
            builder.HasMany(x => x.Tags).WithOne(x => x.Seminar).HasForeignKey(x => x.SeminarId).OnDelete(DeleteBehavior.Cascade);
            builder.HasMany(x => x.Registrations).WithOne(x => x.Seminar).HasForeignKey(x => x.SeminarId).OnDelete(DeleteBehavior.Cascade);
            builder.HasMany(x => x.Comments).WithOne(x => x.Seminar).HasForeignKey(x => x.SeminarId).OnDelete(DeleteBehavior.Cascade);
        }
    }
}
