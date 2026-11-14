using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations
{
    /// <inheritdoc />
    public partial class createDatabaseFirst : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "Website");

            migrationBuilder.EnsureSchema(
                name: "Article");

            migrationBuilder.EnsureSchema(
                name: "User");

            migrationBuilder.EnsureSchema(
                name: "Basket");

            migrationBuilder.EnsureSchema(
                name: "Category");

            migrationBuilder.EnsureSchema(
                name: "Room");

            migrationBuilder.EnsureSchema(
                name: "Course");

            migrationBuilder.EnsureSchema(
                name: "Student");

            migrationBuilder.EnsureSchema(
                name: "Education");

            migrationBuilder.EnsureSchema(
                name: "Enrollment");

            migrationBuilder.EnsureSchema(
                name: "Teacher");

            migrationBuilder.EnsureSchema(
                name: "Order");

            migrationBuilder.EnsureSchema(
                name: "Seminar");

            migrationBuilder.EnsureSchema(
                name: "Tag");

            migrationBuilder.EnsureSchema(
                name: "USER");

            migrationBuilder.CreateTable(
                name: "AboutUsPages",
                schema: "Website",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    HeroTitle = table.Column<string>(type: "NVARCHAR(200)", maxLength: 200, nullable: false),
                    HeroSubtitle = table.Column<string>(type: "NVARCHAR(500)", maxLength: 500, nullable: false),
                    HeroImageUrl = table.Column<string>(type: "NVARCHAR(600)", maxLength: 600, nullable: false),
                    IntroTitle = table.Column<string>(type: "NVARCHAR(200)", maxLength: 200, nullable: false),
                    IntroContentHtml = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                    MissionTitle = table.Column<string>(type: "NVARCHAR(200)", maxLength: 200, nullable: false),
                    MissionContentHtml = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                    VisionTitle = table.Column<string>(type: "NVARCHAR(200)", maxLength: 200, nullable: false),
                    VisionContentHtml = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                    ValuesTitle = table.Column<string>(type: "NVARCHAR(200)", maxLength: 200, nullable: false),
                    ValuesContentHtml = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                    TeamTitle = table.Column<string>(type: "NVARCHAR(200)", maxLength: 200, nullable: false),
                    TeamContentHtml = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                    TeamImageUrl = table.Column<string>(type: "NVARCHAR(600)", maxLength: 600, nullable: false),
                    CtaTitle = table.Column<string>(type: "NVARCHAR(200)", maxLength: 200, nullable: false),
                    CtaSubtitle = table.Column<string>(type: "NVARCHAR(500)", maxLength: 500, nullable: false),
                    CtaButtonText = table.Column<string>(type: "NVARCHAR(120)", maxLength: 120, nullable: false),
                    CtaButtonUrl = table.Column<string>(type: "NVARCHAR(500)", maxLength: 500, nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AboutUsPages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AdminAnnouncements",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Body = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                    Priority = table.Column<byte>(type: "tinyint", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    ExpiresUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdminAnnouncements", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ArticleReactions",
                schema: "Article",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ArticleId = table.Column<long>(type: "bigint", nullable: false),
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    Reaction = table.Column<int>(type: "INT", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ArticleReactions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DiscountCodes",
                schema: "Basket",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Discount_Amount = table.Column<decimal>(type: "DECIMAL(18,0)", nullable: false),
                    Discount_Type = table.Column<string>(type: "VARCHAR(20)", maxLength: 20, nullable: false),
                    Discount_Code = table.Column<string>(type: "VARCHAR(10)", maxLength: 10, nullable: true),
                    ExpirationDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    UsageLimit = table.Column<int>(type: "int", nullable: false),
                    UsedCount = table.Column<int>(type: "int", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DiscountCodes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EducationalProfiles",
                schema: "Student",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EducationalProfiles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EducationPlans",
                schema: "Education",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "NVARCHAR(100)", maxLength: 100, nullable: true),
                    HourlyRate = table.Column<int>(type: "int", nullable: false),
                    TotalHours = table.Column<int>(type: "int", nullable: false),
                    Amount = table.Column<decimal>(type: "DECIMAL(18,4)", nullable: true),
                    Currency = table.Column<string>(type: "VARCHAR(50)", maxLength: 50, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EducationPlans", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "IPBlacklists",
                schema: "User",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IPAddress = table.Column<string>(type: "VARCHAR(20)", maxLength: 20, nullable: true),
                    DeviceInformation = table.Column<string>(type: "VARCHAR(200)", maxLength: 200, nullable: true),
                    Reason = table.Column<string>(type: "NVARCHAR(300)", maxLength: 300, nullable: true),
                    AddedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpirationDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IPBlacklists", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ManagedRoomStudents",
                schema: "Room",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FirstName = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    LastName = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    UserName = table.Column<string>(type: "VARCHAR(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    HashPassword = table.Column<string>(type: "VARCHAR(256)", maxLength: 256, nullable: false),
                    SaltPassword = table.Column<string>(type: "VARCHAR(256)", maxLength: 256, nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Gender = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    DateOfBirth = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PhotoUrl = table.Column<string>(type: "nvarchar(600)", maxLength: 600, nullable: true),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ManagedRoomStudents", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OutBoxEventItems",
                columns: table => new
                {
                    OutBoxEventItemId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EventId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AccruedByUserId = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    AccruedOn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AggregateName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    AggregateTypeName = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    AggregateId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EventName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    EventTypeName = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    EventPayload = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsProcessed = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OutBoxEventItems", x => x.OutBoxEventItemId);
                });

            migrationBuilder.CreateTable(
                name: "RoomSessions",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RoomId = table.Column<long>(type: "bigint", nullable: false),
                    StartTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    StartedByUserId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoomSessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SupportTickets",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DisplayNumber = table.Column<int>(type: "int", nullable: false),
                    Subject = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Message = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    RequesterName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    RequesterAvatarUrl = table.Column<string>(type: "nvarchar(600)", maxLength: 600, nullable: true),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SupportTickets", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserFiles",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    ParentId = table.Column<long>(type: "bigint", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    IsFolder = table.Column<bool>(type: "bit", nullable: false),
                    FileUrl = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserFiles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                schema: "User",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false),
                    UserName = table.Column<string>(type: "VARCHAR(100)", maxLength: 100, nullable: false),
                    HashPassword = table.Column<string>(type: "VARCHAR(256)", maxLength: 256, nullable: false),
                    SaltPassword = table.Column<string>(type: "VARCHAR(256)", maxLength: 256, nullable: false),
                    Email = table.Column<string>(type: "VARCHAR(80)", maxLength: 80, nullable: false),
                    Role = table.Column<byte>(type: "tinyint", nullable: false),
                    EmailVerified = table.Column<bool>(type: "bit", nullable: false),
                    FirstName = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    LastName = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    ProfileImage = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PhoneNumber_CountryCode = table.Column<string>(type: "CHAR(5)", maxLength: 5, nullable: true),
                    PhoneNumber_Number = table.Column<string>(type: "CHAR(12)", maxLength: 12, nullable: true),
                    PhoneNumberVerified = table.Column<bool>(type: "bit", nullable: false),
                    DateOfBirth = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastLoginDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Status = table.Column<string>(type: "CHAR(8)", maxLength: 8, nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "bit", nullable: false),
                    TwoFactorSecret = table.Column<bool>(type: "bit", nullable: false),
                    LoginAttemptCount = table.Column<int>(type: "int", nullable: false),
                    AcceptedTerms = table.Column<bool>(type: "bit", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AboutUsTeamMembers",
                schema: "Website",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FullName = table.Column<string>(type: "NVARCHAR(200)", maxLength: 200, nullable: false),
                    SkillTitle = table.Column<string>(type: "NVARCHAR(200)", maxLength: 200, nullable: false),
                    ImageUrl = table.Column<string>(type: "NVARCHAR(600)", maxLength: 600, nullable: false),
                    GithubUrl = table.Column<string>(type: "NVARCHAR(600)", maxLength: 600, nullable: false),
                    LinkedinUrl = table.Column<string>(type: "NVARCHAR(600)", maxLength: 600, nullable: false),
                    TwitterUrl = table.Column<string>(type: "NVARCHAR(600)", maxLength: 600, nullable: false),
                    InstagramUrl = table.Column<string>(type: "NVARCHAR(600)", maxLength: 600, nullable: false),
                    WebsiteUrl = table.Column<string>(type: "NVARCHAR(600)", maxLength: 600, nullable: false),
                    DisplayOrder = table.Column<int>(type: "INT", nullable: false),
                    AboutUsPageId = table.Column<long>(type: "bigint", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AboutUsTeamMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AboutUsTeamMembers_AboutUsPages_AboutUsPageId",
                        column: x => x.AboutUsPageId,
                        principalSchema: "Website",
                        principalTable: "AboutUsPages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Baskets",
                schema: "Basket",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DiscountCodeId = table.Column<long>(type: "bigint", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Baskets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Baskets_DiscountCodes_DiscountCodeId",
                        column: x => x.DiscountCodeId,
                        principalSchema: "Basket",
                        principalTable: "DiscountCodes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AuditLogs",
                schema: "User",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    Action = table.Column<string>(type: "VARCHAR(50)", maxLength: 50, nullable: false),
                    TimeStamp = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IPAddress = table.Column<string>(type: "CHAR(15)", maxLength: 15, nullable: true),
                    DeviceInformation = table.Column<string>(type: "VARCHAR(250)", maxLength: 250, nullable: true),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AuditLogs_Users_UserId",
                        column: x => x.UserId,
                        principalSchema: "User",
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AuthenticationTokens",
                schema: "User",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    Token = table.Column<string>(type: "VARCHAR(1300)", maxLength: 1300, nullable: false),
                    ExpirationDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IssuedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsRevoked = table.Column<bool>(type: "bit", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuthenticationTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AuthenticationTokens_Users_UserId",
                        column: x => x.UserId,
                        principalSchema: "User",
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Rooms",
                schema: "Room",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Slug = table.Column<string>(type: "VARCHAR(120)", maxLength: 120, nullable: true),
                    Capacity = table.Column<int>(type: "int", nullable: false),
                    ClassRoomLink = table.Column<string>(type: "VARCHAR(800)", maxLength: 800, nullable: false),
                    RoomCode = table.Column<string>(type: "VARCHAR(8)", maxLength: 8, nullable: true),
                    IsGuest = table.Column<bool>(type: "bit", nullable: false),
                    GuestQuantity = table.Column<int>(type: "int", nullable: false),
                    FirstAdminInput = table.Column<bool>(type: "bit", nullable: false),
                    TeacherEntersFirst = table.Column<bool>(type: "bit", nullable: false),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    MaxSessionTime = table.Column<int>(type: "int", nullable: false),
                    DefaultMediaFileId = table.Column<long>(type: "BIGINT", nullable: true),
                    DefaultSlideFileId = table.Column<long>(type: "BIGINT", nullable: true),
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Rooms", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Rooms_Users_UserId",
                        column: x => x.UserId,
                        principalSchema: "User",
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Students",
                schema: "Student",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EducationalProfileId = table.Column<long>(type: "bigint", nullable: true),
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Students", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Students_EducationalProfiles_EducationalProfileId",
                        column: x => x.EducationalProfileId,
                        principalSchema: "Student",
                        principalTable: "EducationalProfiles",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Students_Users_UserId",
                        column: x => x.UserId,
                        principalSchema: "User",
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Teachers",
                schema: "Teacher",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LongDescription = table.Column<string>(type: "NVARCHAR(4000)", maxLength: 4000, nullable: true),
                    UserId = table.Column<long>(type: "bigint", nullable: true),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Teachers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Teachers_Users_UserId",
                        column: x => x.UserId,
                        principalSchema: "User",
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "TwoFactorCodes",
                schema: "USER",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    Code = table.Column<string>(type: "VARCHAR(128)", maxLength: 128, nullable: true),
                    GeneratedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpirationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsUsed = table.Column<bool>(type: "bit", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TwoFactorCodes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TwoFactorCodes_Users_UserId",
                        column: x => x.UserId,
                        principalSchema: "User",
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserClaims",
                schema: "User",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    ClaimType = table.Column<string>(type: "VARCHAR(100)", maxLength: 100, nullable: false),
                    ClaimValue = table.Column<string>(type: "VARCHAR(700)", maxLength: 700, nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserClaims_Users_UserId",
                        column: x => x.UserId,
                        principalSchema: "User",
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserSessions",
                schema: "User",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    ExpirationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserSessions_Users_UserId",
                        column: x => x.UserId,
                        principalSchema: "User",
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Chats",
                schema: "Room",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Message = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    SendAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RoomId = table.Column<long>(type: "bigint", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Chats", x => x.Id);
                    table.ForeignKey(
                        name: "Fk_Chats_Rooms_RoomId",
                        column: x => x.RoomId,
                        principalSchema: "Room",
                        principalTable: "Rooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RoomFiles",
                schema: "Room",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RoomId = table.Column<long>(type: "bigint", nullable: false),
                    FileType = table.Column<int>(type: "int", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    FileUrl = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    UploadedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoomFiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RoomFiles_Rooms_RoomId",
                        column: x => x.RoomId,
                        principalSchema: "Room",
                        principalTable: "Rooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RoomUsers",
                schema: "Room",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FirstName = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    LastName = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    UserName = table.Column<string>(type: "VARCHAR(100)", maxLength: 100, nullable: false),
                    HashPassword = table.Column<string>(type: "VARCHAR(256)", maxLength: 256, nullable: true),
                    SaltPassword = table.Column<string>(type: "VARCHAR(256)", maxLength: 256, nullable: true),
                    IsOnline = table.Column<bool>(type: "bit", nullable: false),
                    IsBlocked = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    RoomId = table.Column<long>(type: "bigint", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    PhotoUrl = table.Column<string>(type: "nvarchar(600)", maxLength: 600, nullable: true),
                    ManagedRoomStudentId = table.Column<long>(type: "bigint", nullable: true),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoomUsers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RoomUsers_ManagedRoomStudents_ManagedRoomStudentId",
                        column: x => x.ManagedRoomStudentId,
                        principalSchema: "Room",
                        principalTable: "ManagedRoomStudents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_RoomUsers_Rooms_RoomId",
                        column: x => x.RoomId,
                        principalSchema: "Room",
                        principalTable: "Rooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Seminars",
                schema: "Seminar",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", maxLength: 2147483647, nullable: true),
                    StartTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Capacity = table.Column<int>(type: "int", nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    IsFree = table.Column<bool>(type: "bit", nullable: false),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    EntryLink = table.Column<string>(type: "nvarchar(800)", maxLength: 800, nullable: true),
                    ThumbnailUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    VideoUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Prerequisites = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    FaqsJson = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    RoomId = table.Column<long>(type: "bigint", nullable: true),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Seminars", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Seminars_Rooms_RoomId",
                        column: x => x.RoomId,
                        principalSchema: "Room",
                        principalTable: "Rooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Orders",
                schema: "Order",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Status = table.Column<byte>(type: "TINYINT", nullable: false),
                    StudentId = table.Column<long>(type: "bigint", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Orders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Orders_Students_StudentId",
                        column: x => x.StudentId,
                        principalSchema: "Student",
                        principalTable: "Students",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ExpertiseAreas",
                schema: "Teacher",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "NVARCHAR(400)", maxLength: 400, nullable: true),
                    Rate = table.Column<int>(type: "INT", nullable: true),
                    TeacherId = table.Column<long>(type: "bigint", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExpertiseAreas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExpertiseAreas_Teachers_TeacherId",
                        column: x => x.TeacherId,
                        principalSchema: "Teacher",
                        principalTable: "Teachers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TeacherEducations",
                schema: "Teacher",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NameOfInstitutionOrUniversity = table.Column<string>(type: "NVARCHAR(500)", maxLength: 500, nullable: true),
                    TypeOfDegree = table.Column<string>(type: "VARCHAR(50)", maxLength: 50, nullable: false),
                    DegreeImage = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TeacherId = table.Column<long>(type: "bigint", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TeacherEducations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TeacherEducations_Teachers_TeacherId",
                        column: x => x.TeacherId,
                        principalSchema: "Teacher",
                        principalTable: "Teachers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FavoriteSeminars",
                schema: "User",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<long>(type: "BIGINT", nullable: false),
                    SeminarId = table.Column<long>(type: "BIGINT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "DATETIME2", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FavoriteSeminars", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FavoriteSeminars_Seminars_SeminarId",
                        column: x => x.SeminarId,
                        principalSchema: "Seminar",
                        principalTable: "Seminars",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FavoriteSeminars_Users_UserId",
                        column: x => x.UserId,
                        principalSchema: "User",
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SeminarComments",
                schema: "Seminar",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Content = table.Column<string>(type: "nvarchar(600)", maxLength: 600, nullable: false),
                    Rating = table.Column<int>(type: "INT", nullable: false),
                    Like = table.Column<int>(type: "INT", nullable: false),
                    IsApproved = table.Column<bool>(type: "bit", nullable: false),
                    UserId = table.Column<long>(type: "bigint", nullable: true),
                    SeminarId = table.Column<long>(type: "bigint", nullable: true),
                    ParentId = table.Column<long>(type: "bigint", nullable: true),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SeminarComments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SeminarComments_SeminarComments_ParentId",
                        column: x => x.ParentId,
                        principalSchema: "Seminar",
                        principalTable: "SeminarComments",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SeminarComments_Seminars_SeminarId",
                        column: x => x.SeminarId,
                        principalSchema: "Seminar",
                        principalTable: "Seminars",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SeminarRegistrations",
                schema: "Seminar",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    SeminarId = table.Column<long>(type: "bigint", nullable: false),
                    HasPaid = table.Column<bool>(type: "bit", nullable: false),
                    RegisteredAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SeminarRegistrations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SeminarRegistrations_Seminars_SeminarId",
                        column: x => x.SeminarId,
                        principalSchema: "Seminar",
                        principalTable: "Seminars",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Invoices",
                schema: "Order",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    InvoiceNumber = table.Column<string>(type: "VARCHAR(50)", nullable: true),
                    InvoiceDate = table.Column<DateTime>(type: "DATETIME2", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "DECIMAL(18,0)", nullable: false),
                    PaidAmount = table.Column<decimal>(type: "DECIMAL(18,0)", nullable: false),
                    Status = table.Column<byte>(type: "TINYINT", nullable: false),
                    Description = table.Column<string>(type: "NVARCHAR(500)", nullable: true),
                    OrderId = table.Column<long>(type: "bigint", nullable: false),
                    StudentId = table.Column<long>(type: "bigint", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Invoices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Invoices_Orders_OrderId",
                        column: x => x.OrderId,
                        principalSchema: "Order",
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Invoices_Students_StudentId",
                        column: x => x.StudentId,
                        principalSchema: "Student",
                        principalTable: "Students",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ArticleComments",
                schema: "Article",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Content = table.Column<string>(type: "nvarchar(600)", maxLength: 600, nullable: false),
                    Rating = table.Column<int>(type: "INT", nullable: false),
                    Like = table.Column<int>(type: "INT", nullable: false),
                    IsApproved = table.Column<bool>(type: "bit", nullable: false),
                    UserId = table.Column<long>(type: "bigint", nullable: true),
                    ArticleId = table.Column<long>(type: "bigint", nullable: true),
                    ParentId = table.Column<long>(type: "bigint", nullable: true),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ArticleComments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ArticleComments_ArticleComments_ParentId",
                        column: x => x.ParentId,
                        principalSchema: "Article",
                        principalTable: "ArticleComments",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Articles",
                schema: "Article",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Summary = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Content = table.Column<string>(type: "nvarchar(max)", maxLength: 2147483647, nullable: true),
                    Slug = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    ThumbnailUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsPublished = table.Column<bool>(type: "bit", nullable: false),
                    PublishedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CategoryId = table.Column<long>(type: "bigint", nullable: true),
                    AuthorUserId = table.Column<long>(type: "bigint", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Articles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Categories",
                schema: "Category",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CategoryName = table.Column<string>(type: "NVARCHAR(150)", maxLength: 150, nullable: false),
                    CategoryDescription = table.Column<string>(type: "NVARCHAR(800)", maxLength: 800, nullable: true),
                    CategoryImage = table.Column<string>(type: "NVARCHAR(500)", maxLength: 500, nullable: false),
                    ParentId = table.Column<long>(type: "bigint", nullable: true),
                    ArticleId = table.Column<long>(type: "bigint", nullable: true),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Categories_Articles_ArticleId",
                        column: x => x.ArticleId,
                        principalSchema: "Article",
                        principalTable: "Articles",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Categories_Categories_ParentId",
                        column: x => x.ParentId,
                        principalSchema: "Category",
                        principalTable: "Categories",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "FavoriteArticles",
                schema: "User",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<long>(type: "BIGINT", nullable: false),
                    ArticleId = table.Column<long>(type: "BIGINT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "DATETIME2", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FavoriteArticles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FavoriteArticles_Articles_ArticleId",
                        column: x => x.ArticleId,
                        principalSchema: "Article",
                        principalTable: "Articles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FavoriteArticles_Users_UserId",
                        column: x => x.UserId,
                        principalSchema: "User",
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Courses",
                schema: "Course",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Status = table.Column<byte>(type: "tinyint", nullable: true),
                    Price = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    AverageRateValue = table.Column<double>(type: "FLOAT", nullable: true),
                    NumberOfRatings = table.Column<short>(type: "SMALLINT", nullable: true),
                    TitleImage = table.Column<string>(type: "NVARCHAR(500)", maxLength: 500, nullable: true),
                    CourseLevel = table.Column<byte>(type: "tinyint", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", maxLength: 2147483647, nullable: true),
                    LongDescription = table.Column<string>(type: "nvarchar(max)", maxLength: 2147483647, nullable: true),
                    IsCompleted = table.Column<bool>(type: "bit", nullable: false),
                    IsPublish = table.Column<bool>(type: "bit", nullable: false),
                    IsCertificate = table.Column<bool>(type: "bit", nullable: false),
                    TeacherId = table.Column<long>(type: "bigint", nullable: true),
                    CategoryId = table.Column<long>(type: "bigint", nullable: true),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EducationPlanId = table.Column<long>(type: "bigint", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Courses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Courses_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalSchema: "Category",
                        principalTable: "Categories",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Courses_EducationPlans_EducationPlanId",
                        column: x => x.EducationPlanId,
                        principalSchema: "Education",
                        principalTable: "EducationPlans",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Courses_Teachers_TeacherId",
                        column: x => x.TeacherId,
                        principalSchema: "Teacher",
                        principalTable: "Teachers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "BasketItems",
                schema: "Basket",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CourseId = table.Column<long>(type: "bigint", nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: true),
                    BasketId = table.Column<long>(type: "bigint", nullable: true),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BasketItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BasketItems_Baskets_BasketId",
                        column: x => x.BasketId,
                        principalSchema: "Basket",
                        principalTable: "Baskets",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_BasketItems_Courses_CourseId",
                        column: x => x.CourseId,
                        principalSchema: "Course",
                        principalTable: "Courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Comments",
                schema: "Course",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Content = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Rating = table.Column<int>(type: "INT", nullable: false),
                    Like = table.Column<int>(type: "INT", nullable: false),
                    IsApproved = table.Column<bool>(type: "bit", nullable: false),
                    UserId = table.Column<long>(type: "bigint", nullable: true),
                    CourseId = table.Column<long>(type: "bigint", nullable: true),
                    ParentId = table.Column<long>(type: "bigint", nullable: true),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Comments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Comments_Comments_ParentId",
                        column: x => x.ParentId,
                        principalSchema: "Course",
                        principalTable: "Comments",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Comments_Courses_CourseId",
                        column: x => x.CourseId,
                        principalSchema: "Course",
                        principalTable: "Courses",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "CourseDependencies",
                schema: "Course",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CourseId = table.Column<long>(type: "bigint", nullable: false),
                    DependencyTitle = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourseDependencies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CourseDependencies_Courses_CourseId",
                        column: x => x.CourseId,
                        principalSchema: "Course",
                        principalTable: "Courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CourseSection",
                schema: "Course",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SessionTitle = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    CourseId = table.Column<long>(type: "bigint", nullable: true),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourseSection", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CourseSection_Courses_CourseId",
                        column: x => x.CourseId,
                        principalSchema: "Course",
                        principalTable: "Courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Enrollments",
                schema: "Enrollment",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    EnrollmentDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    StudentId = table.Column<long>(type: "bigint", nullable: true),
                    CourseId = table.Column<long>(type: "bigint", nullable: true),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Enrollments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Enrollments_Courses_CourseId",
                        column: x => x.CourseId,
                        principalSchema: "Course",
                        principalTable: "Courses",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Enrollments_Students_StudentId",
                        column: x => x.StudentId,
                        principalSchema: "Student",
                        principalTable: "Students",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "FAQs",
                schema: "Course",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Question = table.Column<string>(type: "NVARCHAR(4000)", maxLength: 4000, nullable: true),
                    Answer = table.Column<string>(type: "NVARCHAR(4000)", maxLength: 4000, nullable: true),
                    CourseId = table.Column<long>(type: "bigint", nullable: true),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FAQs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FAQs_Courses_CourseId",
                        column: x => x.CourseId,
                        principalSchema: "Course",
                        principalTable: "Courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FavoriteCourses",
                schema: "User",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<long>(type: "BIGINT", nullable: false),
                    CourseId = table.Column<long>(type: "BIGINT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "DATETIME2", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FavoriteCourses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FavoriteCourses_Courses_CourseId",
                        column: x => x.CourseId,
                        principalSchema: "Course",
                        principalTable: "Courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FavoriteCourses_Users_UserId",
                        column: x => x.UserId,
                        principalSchema: "User",
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OrderItems",
                schema: "Order",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UnitPrice_Amount = table.Column<decimal>(type: "DECIMAL(18,0)", nullable: true),
                    UnitPrice_Currency = table.Column<string>(type: "VARCHAR(3)", maxLength: 3, nullable: true),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    CourseId = table.Column<long>(type: "bigint", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    OrderId = table.Column<long>(type: "bigint", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrderItems_Courses_CourseId",
                        column: x => x.CourseId,
                        principalSchema: "Course",
                        principalTable: "Courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OrderItems_Orders_OrderId",
                        column: x => x.OrderId,
                        principalSchema: "Order",
                        principalTable: "Orders",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Tags",
                schema: "Tag",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TagName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ArticleId = table.Column<long>(type: "bigint", nullable: true),
                    CourseId = table.Column<long>(type: "bigint", nullable: true),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    SeminarId = table.Column<long>(type: "bigint", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tags", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Tags_Articles_ArticleId",
                        column: x => x.ArticleId,
                        principalSchema: "Article",
                        principalTable: "Articles",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Tags_Courses_CourseId",
                        column: x => x.CourseId,
                        principalSchema: "Course",
                        principalTable: "Courses",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Tags_Seminars_SeminarId",
                        column: x => x.SeminarId,
                        principalSchema: "Seminar",
                        principalTable: "Seminars",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Videos",
                schema: "Course",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CourseId = table.Column<long>(type: "bigint", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    VideoPath = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    Duration = table.Column<TimeSpan>(type: "time", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Videos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Videos_Courses_CourseId",
                        column: x => x.CourseId,
                        principalSchema: "Course",
                        principalTable: "Courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CourseLesson",
                schema: "Course",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LessonTitle = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    CourseSectionId = table.Column<long>(type: "bigint", nullable: true),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourseLesson", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CourseLesson_CourseSection_CourseSectionId",
                        column: x => x.CourseSectionId,
                        principalSchema: "Course",
                        principalTable: "CourseSection",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Installments",
                schema: "Enrollment",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DueDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Amount = table.Column<decimal>(type: "DECIMAL(18,4)", nullable: false),
                    IsPaid = table.Column<bool>(type: "bit", nullable: false),
                    PaidDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EnrollmentId = table.Column<long>(type: "bigint", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Installments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Installments_Enrollments_EnrollmentId",
                        column: x => x.EnrollmentId,
                        principalSchema: "Enrollment",
                        principalTable: "Enrollments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Payments",
                schema: "Enrollment",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Amount = table.Column<decimal>(type: "DECIMAL(18,4)", nullable: false),
                    PaymentDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PaymentStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    PaymentMethods = table.Column<byte>(type: "tinyint", nullable: false),
                    PaymentType = table.Column<byte>(type: "tinyint", nullable: false),
                    EnrollmentId = table.Column<long>(type: "bigint", nullable: true),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Payments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Payments_Enrollments_EnrollmentId",
                        column: x => x.EnrollmentId,
                        principalSchema: "Enrollment",
                        principalTable: "Enrollments",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Transactions",
                schema: "Order",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TransactionNumber = table.Column<string>(type: "VARCHAR(100)", nullable: true),
                    TransactionDate = table.Column<DateTime>(type: "DATETIME2", nullable: false),
                    Amount = table.Column<decimal>(type: "DECIMAL(18,0)", nullable: false),
                    Status = table.Column<byte>(type: "TINYINT", nullable: false),
                    ReferenceNumber = table.Column<string>(type: "VARCHAR(100)", nullable: true),
                    Description = table.Column<string>(type: "NVARCHAR(500)", nullable: true),
                    InvoiceId = table.Column<long>(type: "bigint", nullable: true),
                    PaymentId = table.Column<long>(type: "bigint", nullable: true),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Transactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Transactions_Invoices_InvoiceId",
                        column: x => x.InvoiceId,
                        principalSchema: "Order",
                        principalTable: "Invoices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Transactions_Payments_PaymentId",
                        column: x => x.PaymentId,
                        principalSchema: "Enrollment",
                        principalTable: "Payments",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_AboutUsTeamMembers_AboutUsPageId_DisplayOrder",
                schema: "Website",
                table: "AboutUsTeamMembers",
                columns: new[] { "AboutUsPageId", "DisplayOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_ArticleComments_ArticleId",
                schema: "Article",
                table: "ArticleComments",
                column: "ArticleId");

            migrationBuilder.CreateIndex(
                name: "IX_ArticleComments_ParentId",
                schema: "Article",
                table: "ArticleComments",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_ArticleReactions_ArticleId_UserId",
                schema: "Article",
                table: "ArticleReactions",
                columns: new[] { "ArticleId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Articles_AuthorUserId",
                schema: "Article",
                table: "Articles",
                column: "AuthorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Articles_CategoryId",
                schema: "Article",
                table: "Articles",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Articles_Slug",
                schema: "Article",
                table: "Articles",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_UserId",
                schema: "User",
                table: "AuditLogs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AuthenticationTokens_UserId",
                schema: "User",
                table: "AuthenticationTokens",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_BasketItems_BasketId",
                schema: "Basket",
                table: "BasketItems",
                column: "BasketId");

            migrationBuilder.CreateIndex(
                name: "IX_BasketItems_CourseId",
                schema: "Basket",
                table: "BasketItems",
                column: "CourseId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Baskets_DiscountCodeId",
                schema: "Basket",
                table: "Baskets",
                column: "DiscountCodeId");

            migrationBuilder.CreateIndex(
                name: "IX_Categories_ArticleId",
                schema: "Category",
                table: "Categories",
                column: "ArticleId");

            migrationBuilder.CreateIndex(
                name: "IX_Categories_ParentId",
                schema: "Category",
                table: "Categories",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_Chats_Message",
                schema: "Room",
                table: "Chats",
                column: "Message");

            migrationBuilder.CreateIndex(
                name: "IX_Chats_RoomId",
                schema: "Room",
                table: "Chats",
                column: "RoomId");

            migrationBuilder.CreateIndex(
                name: "IX_Comments_CourseId",
                schema: "Course",
                table: "Comments",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_Comments_ParentId",
                schema: "Course",
                table: "Comments",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseDependencies_CourseId",
                schema: "Course",
                table: "CourseDependencies",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseDependencies_DependencyTitle",
                schema: "Course",
                table: "CourseDependencies",
                column: "DependencyTitle");

            migrationBuilder.CreateIndex(
                name: "IX_CourseLesson_CourseSectionId",
                schema: "Course",
                table: "CourseLesson",
                column: "CourseSectionId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseLesson_LessonTitle",
                schema: "Course",
                table: "CourseLesson",
                column: "LessonTitle");

            migrationBuilder.CreateIndex(
                name: "IX_Courses_CategoryId",
                schema: "Course",
                table: "Courses",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Courses_EducationPlanId",
                schema: "Course",
                table: "Courses",
                column: "EducationPlanId");

            migrationBuilder.CreateIndex(
                name: "IX_Courses_Price",
                schema: "Course",
                table: "Courses",
                column: "Price");

            migrationBuilder.CreateIndex(
                name: "IX_Courses_TeacherId",
                schema: "Course",
                table: "Courses",
                column: "TeacherId");

            migrationBuilder.CreateIndex(
                name: "IX_Courses_Title",
                schema: "Course",
                table: "Courses",
                column: "Title");

            migrationBuilder.CreateIndex(
                name: "IX_CourseSection_CourseId",
                schema: "Course",
                table: "CourseSection",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseSection_SessionTitle",
                schema: "Course",
                table: "CourseSection",
                column: "SessionTitle");

            migrationBuilder.CreateIndex(
                name: "IX_EducationPlans_Title",
                schema: "Education",
                table: "EducationPlans",
                column: "Title",
                unique: true,
                filter: "[Title] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Enrollments_CourseId",
                schema: "Enrollment",
                table: "Enrollments",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_Enrollments_StudentId",
                schema: "Enrollment",
                table: "Enrollments",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_ExpertiseAreas_Name",
                schema: "Teacher",
                table: "ExpertiseAreas",
                column: "Name",
                unique: true,
                filter: "[Name] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ExpertiseAreas_TeacherId",
                schema: "Teacher",
                table: "ExpertiseAreas",
                column: "TeacherId");

            migrationBuilder.CreateIndex(
                name: "IX_FAQs_CourseId",
                schema: "Course",
                table: "FAQs",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_FavoriteArticles_ArticleId",
                schema: "User",
                table: "FavoriteArticles",
                column: "ArticleId");

            migrationBuilder.CreateIndex(
                name: "IX_FavoriteArticles_UserId_ArticleId",
                schema: "User",
                table: "FavoriteArticles",
                columns: new[] { "UserId", "ArticleId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FavoriteCourses_CourseId",
                schema: "User",
                table: "FavoriteCourses",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_FavoriteCourses_UserId_CourseId",
                schema: "User",
                table: "FavoriteCourses",
                columns: new[] { "UserId", "CourseId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FavoriteSeminars_SeminarId",
                schema: "User",
                table: "FavoriteSeminars",
                column: "SeminarId");

            migrationBuilder.CreateIndex(
                name: "IX_FavoriteSeminars_UserId_SeminarId",
                schema: "User",
                table: "FavoriteSeminars",
                columns: new[] { "UserId", "SeminarId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Installments_EnrollmentId",
                schema: "Enrollment",
                table: "Installments",
                column: "EnrollmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_OrderId",
                schema: "Order",
                table: "Invoices",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_StudentId",
                schema: "Order",
                table: "Invoices",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_ManagedRoomStudents_Email",
                schema: "Room",
                table: "ManagedRoomStudents",
                column: "Email",
                unique: true,
                filter: "[Email] IS NOT NULL AND [Email] <> N'' AND [IsDelete] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_ManagedRoomStudents_UserName",
                schema: "Room",
                table: "ManagedRoomStudents",
                column: "UserName",
                unique: true,
                filter: "[IsDelete] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_CourseId",
                schema: "Order",
                table: "OrderItems",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_OrderId",
                schema: "Order",
                table: "OrderItems",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_StudentId",
                schema: "Order",
                table: "Orders",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_EnrollmentId",
                schema: "Enrollment",
                table: "Payments",
                column: "EnrollmentId");

            migrationBuilder.CreateIndex(
                name: "IX_RoomFiles_RoomId",
                schema: "Room",
                table: "RoomFiles",
                column: "RoomId");

            migrationBuilder.CreateIndex(
                name: "IX_Rooms_Slug",
                schema: "Room",
                table: "Rooms",
                column: "Slug",
                unique: true,
                filter: "[Slug] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Rooms_Title",
                schema: "Room",
                table: "Rooms",
                column: "Title");

            migrationBuilder.CreateIndex(
                name: "IX_Rooms_UserId",
                schema: "Room",
                table: "Rooms",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_RoomUsers_FirstName",
                schema: "Room",
                table: "RoomUsers",
                column: "FirstName");

            migrationBuilder.CreateIndex(
                name: "IX_RoomUsers_LastName",
                schema: "Room",
                table: "RoomUsers",
                column: "LastName");

            migrationBuilder.CreateIndex(
                name: "IX_RoomUsers_ManagedRoomStudentId",
                schema: "Room",
                table: "RoomUsers",
                column: "ManagedRoomStudentId");

            migrationBuilder.CreateIndex(
                name: "IX_RoomUsers_RoomId",
                schema: "Room",
                table: "RoomUsers",
                column: "RoomId");

            migrationBuilder.CreateIndex(
                name: "IX_SeminarComments_ParentId",
                schema: "Seminar",
                table: "SeminarComments",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_SeminarComments_SeminarId",
                schema: "Seminar",
                table: "SeminarComments",
                column: "SeminarId");

            migrationBuilder.CreateIndex(
                name: "IX_SeminarRegistrations_SeminarId_UserId",
                schema: "Seminar",
                table: "SeminarRegistrations",
                columns: new[] { "SeminarId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Seminars_RoomId",
                schema: "Seminar",
                table: "Seminars",
                column: "RoomId");

            migrationBuilder.CreateIndex(
                name: "IX_Seminars_StartTime",
                schema: "Seminar",
                table: "Seminars",
                column: "StartTime");

            migrationBuilder.CreateIndex(
                name: "IX_Seminars_Status",
                schema: "Seminar",
                table: "Seminars",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Students_EducationalProfileId",
                schema: "Student",
                table: "Students",
                column: "EducationalProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_Students_UserId",
                schema: "Student",
                table: "Students",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tags_ArticleId",
                schema: "Tag",
                table: "Tags",
                column: "ArticleId");

            migrationBuilder.CreateIndex(
                name: "IX_Tags_CourseId",
                schema: "Tag",
                table: "Tags",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_Tags_SeminarId",
                schema: "Tag",
                table: "Tags",
                column: "SeminarId");

            migrationBuilder.CreateIndex(
                name: "IX_Tags_TagName",
                schema: "Tag",
                table: "Tags",
                column: "TagName");

            migrationBuilder.CreateIndex(
                name: "IX_TeacherEducations_NameOfInstitutionOrUniversity_TypeOfDegree",
                schema: "Teacher",
                table: "TeacherEducations",
                columns: new[] { "NameOfInstitutionOrUniversity", "TypeOfDegree" },
                unique: true,
                filter: "[NameOfInstitutionOrUniversity] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_TeacherEducations_TeacherId",
                schema: "Teacher",
                table: "TeacherEducations",
                column: "TeacherId");

            migrationBuilder.CreateIndex(
                name: "IX_Teachers_UserId",
                schema: "Teacher",
                table: "Teachers",
                column: "UserId",
                unique: true,
                filter: "[UserId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_InvoiceId",
                schema: "Order",
                table: "Transactions",
                column: "InvoiceId");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_PaymentId",
                schema: "Order",
                table: "Transactions",
                column: "PaymentId");

            migrationBuilder.CreateIndex(
                name: "IX_TwoFactorCodes_UserId",
                schema: "USER",
                table: "TwoFactorCodes",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserClaims_ClaimType",
                schema: "User",
                table: "UserClaims",
                column: "ClaimType");

            migrationBuilder.CreateIndex(
                name: "IX_UserClaims_UserId",
                schema: "User",
                table: "UserClaims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                schema: "User",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_FirstName",
                schema: "User",
                table: "Users",
                column: "FirstName");

            migrationBuilder.CreateIndex(
                name: "IX_Users_LastName",
                schema: "User",
                table: "Users",
                column: "LastName");

            migrationBuilder.CreateIndex(
                name: "IX_Users_PhoneNumber_CountryCode",
                schema: "User",
                table: "Users",
                column: "PhoneNumber_CountryCode");

            migrationBuilder.CreateIndex(
                name: "IX_Users_PhoneNumber_Number",
                schema: "User",
                table: "Users",
                column: "PhoneNumber_Number",
                unique: true,
                filter: "[PhoneNumber_Number] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Users_UserName",
                schema: "User",
                table: "Users",
                column: "UserName");

            migrationBuilder.CreateIndex(
                name: "IX_UserSessions_UserId",
                schema: "User",
                table: "UserSessions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Videos_CourseId",
                schema: "Course",
                table: "Videos",
                column: "CourseId");

            migrationBuilder.AddForeignKey(
                name: "FK_ArticleComments_Articles_ArticleId",
                schema: "Article",
                table: "ArticleComments",
                column: "ArticleId",
                principalSchema: "Article",
                principalTable: "Articles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Articles_Categories_CategoryId",
                schema: "Article",
                table: "Articles",
                column: "CategoryId",
                principalSchema: "Category",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Categories_Articles_ArticleId",
                schema: "Category",
                table: "Categories");

            migrationBuilder.DropTable(
                name: "AboutUsTeamMembers",
                schema: "Website");

            migrationBuilder.DropTable(
                name: "AdminAnnouncements");

            migrationBuilder.DropTable(
                name: "ArticleComments",
                schema: "Article");

            migrationBuilder.DropTable(
                name: "ArticleReactions",
                schema: "Article");

            migrationBuilder.DropTable(
                name: "AuditLogs",
                schema: "User");

            migrationBuilder.DropTable(
                name: "AuthenticationTokens",
                schema: "User");

            migrationBuilder.DropTable(
                name: "BasketItems",
                schema: "Basket");

            migrationBuilder.DropTable(
                name: "Chats",
                schema: "Room");

            migrationBuilder.DropTable(
                name: "Comments",
                schema: "Course");

            migrationBuilder.DropTable(
                name: "CourseDependencies",
                schema: "Course");

            migrationBuilder.DropTable(
                name: "CourseLesson",
                schema: "Course");

            migrationBuilder.DropTable(
                name: "ExpertiseAreas",
                schema: "Teacher");

            migrationBuilder.DropTable(
                name: "FAQs",
                schema: "Course");

            migrationBuilder.DropTable(
                name: "FavoriteArticles",
                schema: "User");

            migrationBuilder.DropTable(
                name: "FavoriteCourses",
                schema: "User");

            migrationBuilder.DropTable(
                name: "FavoriteSeminars",
                schema: "User");

            migrationBuilder.DropTable(
                name: "Installments",
                schema: "Enrollment");

            migrationBuilder.DropTable(
                name: "IPBlacklists",
                schema: "User");

            migrationBuilder.DropTable(
                name: "OrderItems",
                schema: "Order");

            migrationBuilder.DropTable(
                name: "OutBoxEventItems");

            migrationBuilder.DropTable(
                name: "RoomFiles",
                schema: "Room");

            migrationBuilder.DropTable(
                name: "RoomSessions");

            migrationBuilder.DropTable(
                name: "RoomUsers",
                schema: "Room");

            migrationBuilder.DropTable(
                name: "SeminarComments",
                schema: "Seminar");

            migrationBuilder.DropTable(
                name: "SeminarRegistrations",
                schema: "Seminar");

            migrationBuilder.DropTable(
                name: "SupportTickets");

            migrationBuilder.DropTable(
                name: "Tags",
                schema: "Tag");

            migrationBuilder.DropTable(
                name: "TeacherEducations",
                schema: "Teacher");

            migrationBuilder.DropTable(
                name: "Transactions",
                schema: "Order");

            migrationBuilder.DropTable(
                name: "TwoFactorCodes",
                schema: "USER");

            migrationBuilder.DropTable(
                name: "UserClaims",
                schema: "User");

            migrationBuilder.DropTable(
                name: "UserFiles");

            migrationBuilder.DropTable(
                name: "UserSessions",
                schema: "User");

            migrationBuilder.DropTable(
                name: "Videos",
                schema: "Course");

            migrationBuilder.DropTable(
                name: "AboutUsPages",
                schema: "Website");

            migrationBuilder.DropTable(
                name: "Baskets",
                schema: "Basket");

            migrationBuilder.DropTable(
                name: "CourseSection",
                schema: "Course");

            migrationBuilder.DropTable(
                name: "ManagedRoomStudents",
                schema: "Room");

            migrationBuilder.DropTable(
                name: "Seminars",
                schema: "Seminar");

            migrationBuilder.DropTable(
                name: "Invoices",
                schema: "Order");

            migrationBuilder.DropTable(
                name: "Payments",
                schema: "Enrollment");

            migrationBuilder.DropTable(
                name: "DiscountCodes",
                schema: "Basket");

            migrationBuilder.DropTable(
                name: "Rooms",
                schema: "Room");

            migrationBuilder.DropTable(
                name: "Orders",
                schema: "Order");

            migrationBuilder.DropTable(
                name: "Enrollments",
                schema: "Enrollment");

            migrationBuilder.DropTable(
                name: "Courses",
                schema: "Course");

            migrationBuilder.DropTable(
                name: "Students",
                schema: "Student");

            migrationBuilder.DropTable(
                name: "EducationPlans",
                schema: "Education");

            migrationBuilder.DropTable(
                name: "Teachers",
                schema: "Teacher");

            migrationBuilder.DropTable(
                name: "EducationalProfiles",
                schema: "Student");

            migrationBuilder.DropTable(
                name: "Users",
                schema: "User");

            migrationBuilder.DropTable(
                name: "Articles",
                schema: "Article");

            migrationBuilder.DropTable(
                name: "Categories",
                schema: "Category");
        }
    }
}
