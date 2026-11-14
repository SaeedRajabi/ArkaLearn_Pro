using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Dashboard;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.DashboardConfigure;

public class SupportTicketMessageQueryConfiguration : IEntityTypeConfiguration<SupportTicketMessageQueryModel>
{
    public void Configure(EntityTypeBuilder<SupportTicketMessageQueryModel> builder)
    {
        builder.ToTable("SupportTicketMessages");
        builder.HasKey(x => x.Id);
    }
}
