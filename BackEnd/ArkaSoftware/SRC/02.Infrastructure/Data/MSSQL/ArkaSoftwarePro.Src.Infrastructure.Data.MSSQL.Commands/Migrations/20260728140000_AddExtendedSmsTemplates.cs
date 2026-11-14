using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260728140000_AddExtendedSmsTemplates")]
public partial class AddExtendedSmsTemplates : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "SupportChatStudentUnreadVerifyTemplateId",
            schema: "Website",
            table: "NotificationSettings",
            type: "int",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.AddColumn<string>(
            name: "SupportChatStudentUnreadMessageTemplate",
            schema: "Website",
            table: "NotificationSettings",
            type: "NVARCHAR(MAX)",
            nullable: false,
            defaultValue: "");

        migrationBuilder.AddColumn<int>(
            name: "EducationPlanInstallmentDueVerifyTemplateId",
            schema: "Website",
            table: "NotificationSettings",
            type: "int",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.AddColumn<string>(
            name: "EducationPlanInstallmentDueMessageTemplate",
            schema: "Website",
            table: "NotificationSettings",
            type: "NVARCHAR(MAX)",
            nullable: false,
            defaultValue: "");

        migrationBuilder.Sql("""
            UPDATE [Website].[NotificationSettings]
            SET [SupportChatMessageTemplate] = N'دانشجوی #FULLNAME# یک سوال با عنوان #TITLE# در پشتیبانی طرح کرده و منتظر پاسخ است. ❓ تیم توسعه آرکا نرم افزار'
            WHERE [SupportChatMessageTemplate] IS NULL OR LTRIM(RTRIM([SupportChatMessageTemplate])) = N'';

            UPDATE [Website].[NotificationSettings]
            SET [SupportChatStudentUnreadMessageTemplate] = N'استاد #FULLNAME# به سوال #TITLE# پاسخ داده است. 🧑‍🏫 لطفا بخش پشتیبانی آنلاین رو بررسی کنید. 💻 تیم توسعه آرکا نرم افزار.'
            WHERE [SupportChatStudentUnreadMessageTemplate] IS NULL OR LTRIM(RTRIM([SupportChatStudentUnreadMessageTemplate])) = N'';

            UPDATE [Website].[NotificationSettings]
            SET [EducationPlanInstallmentDueMessageTemplate] = N'دانشجوی گرامی #FULLNAME# ، موعد پرداخت قسط پلن شما با عنوان #TITLE# سررسید شده. لطفاً جهت جلوگیری از غیرفعال شدن پلن خود، تا ۲۴ ساعت آینده نسبت به پرداخت اقدام فرمایید. با احترام تیم توسعه آرکا نرم افزار.'
            WHERE [EducationPlanInstallmentDueMessageTemplate] IS NULL OR LTRIM(RTRIM([EducationPlanInstallmentDueMessageTemplate])) = N'';

            UPDATE [Website].[NotificationSettings]
            SET [SupportChatUnreadSmsDelayMinutes] = 20
            WHERE [SupportChatUnreadSmsDelayMinutes] < 20 OR [SupportChatUnreadSmsDelayMinutes] = 10;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "SupportChatStudentUnreadVerifyTemplateId", schema: "Website", table: "NotificationSettings");
        migrationBuilder.DropColumn(name: "SupportChatStudentUnreadMessageTemplate", schema: "Website", table: "NotificationSettings");
        migrationBuilder.DropColumn(name: "EducationPlanInstallmentDueVerifyTemplateId", schema: "Website", table: "NotificationSettings");
        migrationBuilder.DropColumn(name: "EducationPlanInstallmentDueMessageTemplate", schema: "Website", table: "NotificationSettings");
    }
}
