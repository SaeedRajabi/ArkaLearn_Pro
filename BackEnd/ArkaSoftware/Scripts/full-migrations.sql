IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    IF SCHEMA_ID(N'Website') IS NULL EXEC(N'CREATE SCHEMA [Website];');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    IF SCHEMA_ID(N'Article') IS NULL EXEC(N'CREATE SCHEMA [Article];');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    IF SCHEMA_ID(N'User') IS NULL EXEC(N'CREATE SCHEMA [User];');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    IF SCHEMA_ID(N'Basket') IS NULL EXEC(N'CREATE SCHEMA [Basket];');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    IF SCHEMA_ID(N'Category') IS NULL EXEC(N'CREATE SCHEMA [Category];');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    IF SCHEMA_ID(N'Room') IS NULL EXEC(N'CREATE SCHEMA [Room];');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    IF SCHEMA_ID(N'Course') IS NULL EXEC(N'CREATE SCHEMA [Course];');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    IF SCHEMA_ID(N'Student') IS NULL EXEC(N'CREATE SCHEMA [Student];');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    IF SCHEMA_ID(N'Education') IS NULL EXEC(N'CREATE SCHEMA [Education];');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    IF SCHEMA_ID(N'Enrollment') IS NULL EXEC(N'CREATE SCHEMA [Enrollment];');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    IF SCHEMA_ID(N'Teacher') IS NULL EXEC(N'CREATE SCHEMA [Teacher];');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    IF SCHEMA_ID(N'Order') IS NULL EXEC(N'CREATE SCHEMA [Order];');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    IF SCHEMA_ID(N'Seminar') IS NULL EXEC(N'CREATE SCHEMA [Seminar];');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    IF SCHEMA_ID(N'Tag') IS NULL EXEC(N'CREATE SCHEMA [Tag];');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    IF SCHEMA_ID(N'USER') IS NULL EXEC(N'CREATE SCHEMA [USER];');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Website].[AboutUsPages] (
        [Id] bigint NOT NULL IDENTITY,
        [HeroTitle] NVARCHAR(200) NOT NULL,
        [HeroSubtitle] NVARCHAR(500) NOT NULL,
        [HeroImageUrl] NVARCHAR(600) NOT NULL,
        [IntroTitle] NVARCHAR(200) NOT NULL,
        [IntroContentHtml] NVARCHAR(MAX) NOT NULL,
        [MissionTitle] NVARCHAR(200) NOT NULL,
        [MissionContentHtml] NVARCHAR(MAX) NOT NULL,
        [VisionTitle] NVARCHAR(200) NOT NULL,
        [VisionContentHtml] NVARCHAR(MAX) NOT NULL,
        [ValuesTitle] NVARCHAR(200) NOT NULL,
        [ValuesContentHtml] NVARCHAR(MAX) NOT NULL,
        [TeamTitle] NVARCHAR(200) NOT NULL,
        [TeamContentHtml] NVARCHAR(MAX) NOT NULL,
        [TeamImageUrl] NVARCHAR(600) NOT NULL,
        [CtaTitle] NVARCHAR(200) NOT NULL,
        [CtaSubtitle] NVARCHAR(500) NOT NULL,
        [CtaButtonText] NVARCHAR(120) NOT NULL,
        [CtaButtonUrl] NVARCHAR(500) NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_AboutUsPages] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [AdminAnnouncements] (
        [Id] bigint NOT NULL IDENTITY,
        [Title] nvarchar(300) NOT NULL,
        [Body] NVARCHAR(MAX) NOT NULL,
        [Priority] tinyint NOT NULL,
        [IsActive] bit NOT NULL,
        [ExpiresUtc] datetime2 NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_AdminAnnouncements] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Article].[ArticleReactions] (
        [Id] bigint NOT NULL IDENTITY,
        [ArticleId] bigint NOT NULL,
        [UserId] bigint NOT NULL,
        [Reaction] INT NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_ArticleReactions] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Basket].[DiscountCodes] (
        [Id] bigint NOT NULL IDENTITY,
        [Discount_Amount] DECIMAL(18,0) NOT NULL,
        [Discount_Type] VARCHAR(20) NOT NULL,
        [Discount_Code] VARCHAR(10) NULL,
        [ExpirationDate] datetime2 NOT NULL,
        [IsActive] bit NOT NULL,
        [UsageLimit] int NOT NULL,
        [UsedCount] int NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_DiscountCodes] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Student].[EducationalProfiles] (
        [Id] bigint NOT NULL IDENTITY,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_EducationalProfiles] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Education].[EducationPlans] (
        [Id] bigint NOT NULL IDENTITY,
        [Title] NVARCHAR(100) NULL,
        [HourlyRate] int NOT NULL,
        [TotalHours] int NOT NULL,
        [Amount] DECIMAL(18,4) NULL,
        [Currency] VARCHAR(50) NULL,
        [Description] nvarchar(500) NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_EducationPlans] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [User].[IPBlacklists] (
        [Id] bigint NOT NULL IDENTITY,
        [IPAddress] VARCHAR(20) NULL,
        [DeviceInformation] VARCHAR(200) NULL,
        [Reason] NVARCHAR(300) NULL,
        [AddedDate] datetime2 NOT NULL,
        [ExpirationDate] datetime2 NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_IPBlacklists] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Room].[ManagedRoomStudents] (
        [Id] bigint NOT NULL IDENTITY,
        [FirstName] nvarchar(80) NOT NULL,
        [LastName] nvarchar(80) NOT NULL,
        [UserName] VARCHAR(100) NOT NULL,
        [Email] nvarchar(256) NULL,
        [HashPassword] VARCHAR(256) NOT NULL,
        [SaltPassword] VARCHAR(256) NOT NULL,
        [Phone] nvarchar(40) NULL,
        [Notes] nvarchar(2000) NULL,
        [Gender] nvarchar(30) NULL,
        [DateOfBirth] datetime2 NULL,
        [PhotoUrl] nvarchar(600) NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_ManagedRoomStudents] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [OutBoxEventItems] (
        [OutBoxEventItemId] bigint NOT NULL IDENTITY,
        [EventId] uniqueidentifier NOT NULL,
        [AccruedByUserId] nvarchar(255) NOT NULL,
        [AccruedOn] datetime2 NOT NULL,
        [AggregateName] nvarchar(255) NOT NULL,
        [AggregateTypeName] nvarchar(500) NOT NULL,
        [AggregateId] nvarchar(max) NOT NULL,
        [EventName] nvarchar(255) NOT NULL,
        [EventTypeName] nvarchar(500) NOT NULL,
        [EventPayload] nvarchar(max) NOT NULL,
        [IsProcessed] bit NOT NULL,
        CONSTRAINT [PK_OutBoxEventItems] PRIMARY KEY ([OutBoxEventItemId])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [RoomSessions] (
        [Id] bigint NOT NULL IDENTITY,
        [RoomId] bigint NOT NULL,
        [StartTime] datetime2 NOT NULL,
        [EndTime] datetime2 NULL,
        [Status] nvarchar(50) NOT NULL,
        [StartedByUserId] nvarchar(100) NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_RoomSessions] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [SupportTickets] (
        [Id] bigint NOT NULL IDENTITY,
        [DisplayNumber] int NOT NULL,
        [Subject] nvarchar(300) NOT NULL,
        [Message] NVARCHAR(MAX) NOT NULL,
        [Status] nvarchar(50) NOT NULL,
        [RequesterName] nvarchar(200) NOT NULL,
        [RequesterAvatarUrl] nvarchar(600) NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_SupportTickets] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [UserFiles] (
        [Id] bigint NOT NULL IDENTITY,
        [UserId] bigint NOT NULL,
        [ParentId] bigint NULL,
        [Name] nvarchar(255) NOT NULL,
        [IsFolder] bit NOT NULL,
        [FileUrl] nvarchar(1000) NULL,
        [FileSize] bigint NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_UserFiles] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [User].[Users] (
        [Id] bigint NOT NULL,
        [UserName] VARCHAR(100) NOT NULL,
        [HashPassword] VARCHAR(256) NOT NULL,
        [SaltPassword] VARCHAR(256) NOT NULL,
        [Email] VARCHAR(80) NOT NULL,
        [Role] tinyint NOT NULL,
        [EmailVerified] bit NOT NULL,
        [FirstName] nvarchar(80) NULL,
        [LastName] nvarchar(80) NULL,
        [ProfileImage] nvarchar(max) NULL,
        [PhoneNumber_CountryCode] CHAR(5) NULL,
        [PhoneNumber_Number] CHAR(12) NULL,
        [PhoneNumberVerified] bit NOT NULL,
        [DateOfBirth] datetime2 NULL,
        [LastLoginDateTime] datetime2 NULL,
        [Status] CHAR(8) NOT NULL,
        [TwoFactorEnabled] bit NOT NULL,
        [TwoFactorSecret] bit NOT NULL,
        [LoginAttemptCount] int NOT NULL,
        [AcceptedTerms] bit NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Website].[AboutUsTeamMembers] (
        [Id] bigint NOT NULL IDENTITY,
        [FullName] NVARCHAR(200) NOT NULL,
        [SkillTitle] NVARCHAR(200) NOT NULL,
        [ImageUrl] NVARCHAR(600) NOT NULL,
        [GithubUrl] NVARCHAR(600) NOT NULL,
        [LinkedinUrl] NVARCHAR(600) NOT NULL,
        [TwitterUrl] NVARCHAR(600) NOT NULL,
        [InstagramUrl] NVARCHAR(600) NOT NULL,
        [WebsiteUrl] NVARCHAR(600) NOT NULL,
        [DisplayOrder] INT NOT NULL,
        [AboutUsPageId] bigint NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_AboutUsTeamMembers] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AboutUsTeamMembers_AboutUsPages_AboutUsPageId] FOREIGN KEY ([AboutUsPageId]) REFERENCES [Website].[AboutUsPages] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Basket].[Baskets] (
        [Id] bigint NOT NULL IDENTITY,
        [DiscountCodeId] bigint NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_Baskets] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Baskets_DiscountCodes_DiscountCodeId] FOREIGN KEY ([DiscountCodeId]) REFERENCES [Basket].[DiscountCodes] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [User].[AuditLogs] (
        [Id] bigint NOT NULL IDENTITY,
        [UserId] bigint NOT NULL,
        [Action] VARCHAR(50) NOT NULL,
        [TimeStamp] datetime2 NULL,
        [IPAddress] CHAR(15) NULL,
        [DeviceInformation] VARCHAR(250) NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_AuditLogs] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AuditLogs_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [User].[Users] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [User].[AuthenticationTokens] (
        [Id] bigint NOT NULL IDENTITY,
        [UserId] bigint NOT NULL,
        [Token] VARCHAR(1300) NOT NULL,
        [ExpirationDate] datetime2 NOT NULL,
        [IssuedAt] datetime2 NULL,
        [IsRevoked] bit NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_AuthenticationTokens] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AuthenticationTokens_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [User].[Users] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Room].[Rooms] (
        [Id] bigint NOT NULL IDENTITY,
        [Title] nvarchar(150) NOT NULL,
        [Slug] VARCHAR(120) NULL,
        [Capacity] int NOT NULL,
        [ClassRoomLink] VARCHAR(800) NOT NULL,
        [RoomCode] VARCHAR(8) NULL,
        [IsGuest] bit NOT NULL,
        [GuestQuantity] int NOT NULL,
        [FirstAdminInput] bit NOT NULL,
        [TeacherEntersFirst] bit NOT NULL,
        [Status] tinyint NOT NULL,
        [MaxSessionTime] int NOT NULL,
        [DefaultMediaFileId] BIGINT NULL,
        [DefaultSlideFileId] BIGINT NULL,
        [UserId] bigint NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_Rooms] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Rooms_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [User].[Users] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Student].[Students] (
        [Id] bigint NOT NULL IDENTITY,
        [EducationalProfileId] bigint NULL,
        [UserId] bigint NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_Students] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Students_EducationalProfiles_EducationalProfileId] FOREIGN KEY ([EducationalProfileId]) REFERENCES [Student].[EducationalProfiles] ([Id]),
        CONSTRAINT [FK_Students_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [User].[Users] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Teacher].[Teachers] (
        [Id] bigint NOT NULL IDENTITY,
        [LongDescription] NVARCHAR(4000) NULL,
        [UserId] bigint NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_Teachers] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Teachers_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [User].[Users] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [USER].[TwoFactorCodes] (
        [Id] bigint NOT NULL IDENTITY,
        [UserId] bigint NOT NULL,
        [Code] VARCHAR(128) NULL,
        [GeneratedAt] datetime2 NOT NULL,
        [ExpirationTime] datetime2 NOT NULL,
        [IsUsed] bit NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_TwoFactorCodes] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_TwoFactorCodes_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [User].[Users] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [User].[UserClaims] (
        [Id] bigint NOT NULL IDENTITY,
        [UserId] bigint NOT NULL,
        [ClaimType] VARCHAR(100) NOT NULL,
        [ClaimValue] VARCHAR(700) NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_UserClaims] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_UserClaims_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [User].[Users] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [User].[UserSessions] (
        [Id] bigint NOT NULL IDENTITY,
        [UserId] bigint NOT NULL,
        [ExpirationTime] datetime2 NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_UserSessions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_UserSessions_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [User].[Users] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Room].[Chats] (
        [Id] bigint NOT NULL IDENTITY,
        [Message] nvarchar(450) NULL,
        [SendAt] datetime2 NOT NULL,
        [RoomId] bigint NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_Chats] PRIMARY KEY ([Id]),
        CONSTRAINT [Fk_Chats_Rooms_RoomId] FOREIGN KEY ([RoomId]) REFERENCES [Room].[Rooms] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Room].[RoomFiles] (
        [Id] bigint NOT NULL IDENTITY,
        [RoomId] bigint NOT NULL,
        [FileType] int NOT NULL,
        [FileName] nvarchar(256) NOT NULL,
        [FileUrl] nvarchar(2000) NOT NULL,
        [FileSize] bigint NOT NULL,
        [UploadedByUserId] nvarchar(max) NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_RoomFiles] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_RoomFiles_Rooms_RoomId] FOREIGN KEY ([RoomId]) REFERENCES [Room].[Rooms] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Room].[RoomUsers] (
        [Id] bigint NOT NULL IDENTITY,
        [FirstName] nvarchar(80) NULL,
        [LastName] nvarchar(80) NULL,
        [UserName] VARCHAR(100) NOT NULL,
        [HashPassword] VARCHAR(256) NULL,
        [SaltPassword] VARCHAR(256) NULL,
        [IsOnline] bit NOT NULL,
        [IsBlocked] bit NOT NULL DEFAULT CAST(0 AS bit),
        [RoomId] bigint NOT NULL,
        [Email] nvarchar(256) NULL,
        [PhotoUrl] nvarchar(600) NULL,
        [ManagedRoomStudentId] bigint NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_RoomUsers] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_RoomUsers_ManagedRoomStudents_ManagedRoomStudentId] FOREIGN KEY ([ManagedRoomStudentId]) REFERENCES [Room].[ManagedRoomStudents] ([Id]) ON DELETE SET NULL,
        CONSTRAINT [FK_RoomUsers_Rooms_RoomId] FOREIGN KEY ([RoomId]) REFERENCES [Room].[Rooms] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Seminar].[Seminars] (
        [Id] bigint NOT NULL IDENTITY,
        [Title] nvarchar(200) NOT NULL,
        [Description] nvarchar(max) NULL,
        [StartTime] datetime2 NOT NULL,
        [EndTime] datetime2 NOT NULL,
        [Capacity] int NOT NULL,
        [Price] decimal(18,2) NULL,
        [IsFree] bit NOT NULL,
        [Status] tinyint NOT NULL,
        [EntryLink] nvarchar(800) NULL,
        [ThumbnailUrl] nvarchar(500) NULL,
        [VideoUrl] nvarchar(500) NULL,
        [Prerequisites] nvarchar(4000) NULL,
        [FaqsJson] nvarchar(4000) NULL,
        [RoomId] bigint NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_Seminars] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Seminars_Rooms_RoomId] FOREIGN KEY ([RoomId]) REFERENCES [Room].[Rooms] ([Id]) ON DELETE SET NULL
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Order].[Orders] (
        [Id] bigint NOT NULL IDENTITY,
        [Status] TINYINT NOT NULL,
        [StudentId] bigint NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_Orders] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Orders_Students_StudentId] FOREIGN KEY ([StudentId]) REFERENCES [Student].[Students] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Teacher].[ExpertiseAreas] (
        [Id] bigint NOT NULL IDENTITY,
        [Name] NVARCHAR(400) NULL,
        [Rate] INT NULL,
        [TeacherId] bigint NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_ExpertiseAreas] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ExpertiseAreas_Teachers_TeacherId] FOREIGN KEY ([TeacherId]) REFERENCES [Teacher].[Teachers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Teacher].[TeacherEducations] (
        [Id] bigint NOT NULL IDENTITY,
        [NameOfInstitutionOrUniversity] NVARCHAR(500) NULL,
        [TypeOfDegree] VARCHAR(50) NOT NULL,
        [DegreeImage] nvarchar(max) NULL,
        [TeacherId] bigint NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_TeacherEducations] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_TeacherEducations_Teachers_TeacherId] FOREIGN KEY ([TeacherId]) REFERENCES [Teacher].[Teachers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [User].[FavoriteSeminars] (
        [Id] bigint NOT NULL IDENTITY,
        [UserId] BIGINT NOT NULL,
        [SeminarId] BIGINT NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_FavoriteSeminars] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_FavoriteSeminars_Seminars_SeminarId] FOREIGN KEY ([SeminarId]) REFERENCES [Seminar].[Seminars] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_FavoriteSeminars_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [User].[Users] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Seminar].[SeminarComments] (
        [Id] bigint NOT NULL IDENTITY,
        [Content] nvarchar(600) NOT NULL,
        [Rating] INT NOT NULL,
        [Like] INT NOT NULL,
        [IsApproved] bit NOT NULL,
        [UserId] bigint NULL,
        [SeminarId] bigint NULL,
        [ParentId] bigint NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_SeminarComments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_SeminarComments_SeminarComments_ParentId] FOREIGN KEY ([ParentId]) REFERENCES [Seminar].[SeminarComments] ([Id]),
        CONSTRAINT [FK_SeminarComments_Seminars_SeminarId] FOREIGN KEY ([SeminarId]) REFERENCES [Seminar].[Seminars] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Seminar].[SeminarRegistrations] (
        [Id] bigint NOT NULL IDENTITY,
        [UserId] bigint NOT NULL,
        [SeminarId] bigint NOT NULL,
        [HasPaid] bit NOT NULL,
        [RegisteredAt] datetime2 NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_SeminarRegistrations] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_SeminarRegistrations_Seminars_SeminarId] FOREIGN KEY ([SeminarId]) REFERENCES [Seminar].[Seminars] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Order].[Invoices] (
        [Id] bigint NOT NULL IDENTITY,
        [InvoiceNumber] VARCHAR(50) NULL,
        [InvoiceDate] DATETIME2 NOT NULL,
        [TotalAmount] DECIMAL(18,0) NOT NULL,
        [PaidAmount] DECIMAL(18,0) NOT NULL,
        [Status] TINYINT NOT NULL,
        [Description] NVARCHAR(500) NULL,
        [OrderId] bigint NOT NULL,
        [StudentId] bigint NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_Invoices] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Invoices_Orders_OrderId] FOREIGN KEY ([OrderId]) REFERENCES [Order].[Orders] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Invoices_Students_StudentId] FOREIGN KEY ([StudentId]) REFERENCES [Student].[Students] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Article].[ArticleComments] (
        [Id] bigint NOT NULL IDENTITY,
        [Content] nvarchar(600) NOT NULL,
        [Rating] INT NOT NULL,
        [Like] INT NOT NULL,
        [IsApproved] bit NOT NULL,
        [UserId] bigint NULL,
        [ArticleId] bigint NULL,
        [ParentId] bigint NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_ArticleComments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ArticleComments_ArticleComments_ParentId] FOREIGN KEY ([ParentId]) REFERENCES [Article].[ArticleComments] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Article].[Articles] (
        [Id] bigint NOT NULL IDENTITY,
        [Title] nvarchar(200) NOT NULL,
        [Summary] nvarchar(500) NULL,
        [Content] nvarchar(max) NULL,
        [Slug] nvarchar(250) NOT NULL,
        [ThumbnailUrl] nvarchar(500) NULL,
        [IsPublished] bit NOT NULL,
        [PublishedAt] datetime2 NULL,
        [CategoryId] bigint NULL,
        [AuthorUserId] bigint NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_Articles] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Category].[Categories] (
        [Id] bigint NOT NULL IDENTITY,
        [CategoryName] NVARCHAR(150) NOT NULL,
        [CategoryDescription] NVARCHAR(800) NULL,
        [CategoryImage] NVARCHAR(500) NOT NULL,
        [ParentId] bigint NULL,
        [ArticleId] bigint NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_Categories] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Categories_Articles_ArticleId] FOREIGN KEY ([ArticleId]) REFERENCES [Article].[Articles] ([Id]),
        CONSTRAINT [FK_Categories_Categories_ParentId] FOREIGN KEY ([ParentId]) REFERENCES [Category].[Categories] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [User].[FavoriteArticles] (
        [Id] bigint NOT NULL IDENTITY,
        [UserId] BIGINT NOT NULL,
        [ArticleId] BIGINT NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_FavoriteArticles] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_FavoriteArticles_Articles_ArticleId] FOREIGN KEY ([ArticleId]) REFERENCES [Article].[Articles] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_FavoriteArticles_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [User].[Users] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Course].[Courses] (
        [Id] bigint NOT NULL IDENTITY,
        [Title] nvarchar(100) NULL,
        [Status] tinyint NULL,
        [Price] decimal(18,2) NULL,
        [AverageRateValue] FLOAT NULL,
        [NumberOfRatings] SMALLINT NULL,
        [TitleImage] NVARCHAR(500) NULL,
        [CourseLevel] tinyint NULL,
        [Description] nvarchar(max) NULL,
        [LongDescription] nvarchar(max) NULL,
        [IsCompleted] bit NOT NULL,
        [IsPublish] bit NOT NULL,
        [IsCertificate] bit NOT NULL,
        [TeacherId] bigint NULL,
        [CategoryId] bigint NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [EducationPlanId] bigint NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_Courses] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Courses_Categories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [Category].[Categories] ([Id]),
        CONSTRAINT [FK_Courses_EducationPlans_EducationPlanId] FOREIGN KEY ([EducationPlanId]) REFERENCES [Education].[EducationPlans] ([Id]),
        CONSTRAINT [FK_Courses_Teachers_TeacherId] FOREIGN KEY ([TeacherId]) REFERENCES [Teacher].[Teachers] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Basket].[BasketItems] (
        [Id] bigint NOT NULL IDENTITY,
        [CourseId] bigint NOT NULL,
        [Quantity] int NULL,
        [BasketId] bigint NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_BasketItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_BasketItems_Baskets_BasketId] FOREIGN KEY ([BasketId]) REFERENCES [Basket].[Baskets] ([Id]),
        CONSTRAINT [FK_BasketItems_Courses_CourseId] FOREIGN KEY ([CourseId]) REFERENCES [Course].[Courses] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Course].[Comments] (
        [Id] bigint NOT NULL IDENTITY,
        [Content] nvarchar(100) NOT NULL,
        [Rating] INT NOT NULL,
        [Like] INT NOT NULL,
        [IsApproved] bit NOT NULL,
        [UserId] bigint NULL,
        [CourseId] bigint NULL,
        [ParentId] bigint NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_Comments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Comments_Comments_ParentId] FOREIGN KEY ([ParentId]) REFERENCES [Course].[Comments] ([Id]),
        CONSTRAINT [FK_Comments_Courses_CourseId] FOREIGN KEY ([CourseId]) REFERENCES [Course].[Courses] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Course].[CourseDependencies] (
        [Id] bigint NOT NULL IDENTITY,
        [CourseId] bigint NOT NULL,
        [DependencyTitle] nvarchar(100) NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_CourseDependencies] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CourseDependencies_Courses_CourseId] FOREIGN KEY ([CourseId]) REFERENCES [Course].[Courses] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Course].[CourseSection] (
        [Id] bigint NOT NULL IDENTITY,
        [SessionTitle] nvarchar(500) NOT NULL,
        [CourseId] bigint NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_CourseSection] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CourseSection_Courses_CourseId] FOREIGN KEY ([CourseId]) REFERENCES [Course].[Courses] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Enrollment].[Enrollments] (
        [Id] bigint NOT NULL IDENTITY,
        [IsActive] bit NOT NULL,
        [EnrollmentDateTime] datetime2 NOT NULL,
        [StudentId] bigint NULL,
        [CourseId] bigint NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_Enrollments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Enrollments_Courses_CourseId] FOREIGN KEY ([CourseId]) REFERENCES [Course].[Courses] ([Id]),
        CONSTRAINT [FK_Enrollments_Students_StudentId] FOREIGN KEY ([StudentId]) REFERENCES [Student].[Students] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Course].[FAQs] (
        [Id] bigint NOT NULL IDENTITY,
        [Question] NVARCHAR(4000) NULL,
        [Answer] NVARCHAR(4000) NULL,
        [CourseId] bigint NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_FAQs] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_FAQs_Courses_CourseId] FOREIGN KEY ([CourseId]) REFERENCES [Course].[Courses] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [User].[FavoriteCourses] (
        [Id] bigint NOT NULL IDENTITY,
        [UserId] BIGINT NOT NULL,
        [CourseId] BIGINT NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_FavoriteCourses] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_FavoriteCourses_Courses_CourseId] FOREIGN KEY ([CourseId]) REFERENCES [Course].[Courses] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_FavoriteCourses_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [User].[Users] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Order].[OrderItems] (
        [Id] bigint NOT NULL IDENTITY,
        [UnitPrice_Amount] DECIMAL(18,0) NULL,
        [UnitPrice_Currency] VARCHAR(3) NULL,
        [Quantity] int NOT NULL,
        [CourseId] bigint NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [OrderId] bigint NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_OrderItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_OrderItems_Courses_CourseId] FOREIGN KEY ([CourseId]) REFERENCES [Course].[Courses] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_OrderItems_Orders_OrderId] FOREIGN KEY ([OrderId]) REFERENCES [Order].[Orders] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Tag].[Tags] (
        [Id] bigint NOT NULL IDENTITY,
        [TagName] nvarchar(100) NOT NULL,
        [ArticleId] bigint NULL,
        [CourseId] bigint NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [SeminarId] bigint NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_Tags] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Tags_Articles_ArticleId] FOREIGN KEY ([ArticleId]) REFERENCES [Article].[Articles] ([Id]),
        CONSTRAINT [FK_Tags_Courses_CourseId] FOREIGN KEY ([CourseId]) REFERENCES [Course].[Courses] ([Id]),
        CONSTRAINT [FK_Tags_Seminars_SeminarId] FOREIGN KEY ([SeminarId]) REFERENCES [Seminar].[Seminars] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Course].[Videos] (
        [Id] bigint NOT NULL IDENTITY,
        [CourseId] bigint NOT NULL,
        [Title] nvarchar(100) NULL,
        [VideoPath] nvarchar(250) NULL,
        [Duration] time NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_Videos] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Videos_Courses_CourseId] FOREIGN KEY ([CourseId]) REFERENCES [Course].[Courses] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Course].[CourseLesson] (
        [Id] bigint NOT NULL IDENTITY,
        [LessonTitle] nvarchar(1000) NOT NULL,
        [CourseSectionId] bigint NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_CourseLesson] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CourseLesson_CourseSection_CourseSectionId] FOREIGN KEY ([CourseSectionId]) REFERENCES [Course].[CourseSection] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Enrollment].[Installments] (
        [Id] bigint NOT NULL IDENTITY,
        [DueDate] datetime2 NOT NULL,
        [Amount] DECIMAL(18,4) NOT NULL,
        [IsPaid] bit NOT NULL,
        [PaidDate] datetime2 NULL,
        [EnrollmentId] bigint NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_Installments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Installments_Enrollments_EnrollmentId] FOREIGN KEY ([EnrollmentId]) REFERENCES [Enrollment].[Enrollments] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Enrollment].[Payments] (
        [Id] bigint NOT NULL IDENTITY,
        [Amount] DECIMAL(18,4) NOT NULL,
        [PaymentDate] datetime2 NOT NULL,
        [PaymentStatus] tinyint NOT NULL,
        [PaymentMethods] tinyint NOT NULL,
        [PaymentType] tinyint NOT NULL,
        [EnrollmentId] bigint NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_Payments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Payments_Enrollments_EnrollmentId] FOREIGN KEY ([EnrollmentId]) REFERENCES [Enrollment].[Enrollments] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE TABLE [Order].[Transactions] (
        [Id] bigint NOT NULL IDENTITY,
        [TransactionNumber] VARCHAR(100) NULL,
        [TransactionDate] DATETIME2 NOT NULL,
        [Amount] DECIMAL(18,0) NOT NULL,
        [Status] TINYINT NOT NULL,
        [ReferenceNumber] VARCHAR(100) NULL,
        [Description] NVARCHAR(500) NULL,
        [InvoiceId] bigint NULL,
        [PaymentId] bigint NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_Transactions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Transactions_Invoices_InvoiceId] FOREIGN KEY ([InvoiceId]) REFERENCES [Order].[Invoices] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Transactions_Payments_PaymentId] FOREIGN KEY ([PaymentId]) REFERENCES [Enrollment].[Payments] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_AboutUsTeamMembers_AboutUsPageId_DisplayOrder] ON [Website].[AboutUsTeamMembers] ([AboutUsPageId], [DisplayOrder]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_ArticleComments_ArticleId] ON [Article].[ArticleComments] ([ArticleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_ArticleComments_ParentId] ON [Article].[ArticleComments] ([ParentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ArticleReactions_ArticleId_UserId] ON [Article].[ArticleReactions] ([ArticleId], [UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Articles_AuthorUserId] ON [Article].[Articles] ([AuthorUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Articles_CategoryId] ON [Article].[Articles] ([CategoryId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Articles_Slug] ON [Article].[Articles] ([Slug]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_AuditLogs_UserId] ON [User].[AuditLogs] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_AuthenticationTokens_UserId] ON [User].[AuthenticationTokens] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_BasketItems_BasketId] ON [Basket].[BasketItems] ([BasketId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE UNIQUE INDEX [IX_BasketItems_CourseId] ON [Basket].[BasketItems] ([CourseId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Baskets_DiscountCodeId] ON [Basket].[Baskets] ([DiscountCodeId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Categories_ArticleId] ON [Category].[Categories] ([ArticleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Categories_ParentId] ON [Category].[Categories] ([ParentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Chats_Message] ON [Room].[Chats] ([Message]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Chats_RoomId] ON [Room].[Chats] ([RoomId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Comments_CourseId] ON [Course].[Comments] ([CourseId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Comments_ParentId] ON [Course].[Comments] ([ParentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_CourseDependencies_CourseId] ON [Course].[CourseDependencies] ([CourseId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_CourseDependencies_DependencyTitle] ON [Course].[CourseDependencies] ([DependencyTitle]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_CourseLesson_CourseSectionId] ON [Course].[CourseLesson] ([CourseSectionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_CourseLesson_LessonTitle] ON [Course].[CourseLesson] ([LessonTitle]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Courses_CategoryId] ON [Course].[Courses] ([CategoryId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Courses_EducationPlanId] ON [Course].[Courses] ([EducationPlanId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Courses_Price] ON [Course].[Courses] ([Price]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Courses_TeacherId] ON [Course].[Courses] ([TeacherId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Courses_Title] ON [Course].[Courses] ([Title]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_CourseSection_CourseId] ON [Course].[CourseSection] ([CourseId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_CourseSection_SessionTitle] ON [Course].[CourseSection] ([SessionTitle]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_EducationPlans_Title] ON [Education].[EducationPlans] ([Title]) WHERE [Title] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Enrollments_CourseId] ON [Enrollment].[Enrollments] ([CourseId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Enrollments_StudentId] ON [Enrollment].[Enrollments] ([StudentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_ExpertiseAreas_Name] ON [Teacher].[ExpertiseAreas] ([Name]) WHERE [Name] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_ExpertiseAreas_TeacherId] ON [Teacher].[ExpertiseAreas] ([TeacherId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_FAQs_CourseId] ON [Course].[FAQs] ([CourseId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_FavoriteArticles_ArticleId] ON [User].[FavoriteArticles] ([ArticleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE UNIQUE INDEX [IX_FavoriteArticles_UserId_ArticleId] ON [User].[FavoriteArticles] ([UserId], [ArticleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_FavoriteCourses_CourseId] ON [User].[FavoriteCourses] ([CourseId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE UNIQUE INDEX [IX_FavoriteCourses_UserId_CourseId] ON [User].[FavoriteCourses] ([UserId], [CourseId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_FavoriteSeminars_SeminarId] ON [User].[FavoriteSeminars] ([SeminarId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE UNIQUE INDEX [IX_FavoriteSeminars_UserId_SeminarId] ON [User].[FavoriteSeminars] ([UserId], [SeminarId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Installments_EnrollmentId] ON [Enrollment].[Installments] ([EnrollmentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Invoices_OrderId] ON [Order].[Invoices] ([OrderId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Invoices_StudentId] ON [Order].[Invoices] ([StudentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_ManagedRoomStudents_Email] ON [Room].[ManagedRoomStudents] ([Email]) WHERE [Email] IS NOT NULL AND [Email] <> N'''' AND [IsDelete] = 0');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_ManagedRoomStudents_UserName] ON [Room].[ManagedRoomStudents] ([UserName]) WHERE [IsDelete] = 0');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_OrderItems_CourseId] ON [Order].[OrderItems] ([CourseId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_OrderItems_OrderId] ON [Order].[OrderItems] ([OrderId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Orders_StudentId] ON [Order].[Orders] ([StudentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Payments_EnrollmentId] ON [Enrollment].[Payments] ([EnrollmentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_RoomFiles_RoomId] ON [Room].[RoomFiles] ([RoomId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_Rooms_Slug] ON [Room].[Rooms] ([Slug]) WHERE [Slug] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Rooms_Title] ON [Room].[Rooms] ([Title]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Rooms_UserId] ON [Room].[Rooms] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_RoomUsers_FirstName] ON [Room].[RoomUsers] ([FirstName]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_RoomUsers_LastName] ON [Room].[RoomUsers] ([LastName]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_RoomUsers_ManagedRoomStudentId] ON [Room].[RoomUsers] ([ManagedRoomStudentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_RoomUsers_RoomId] ON [Room].[RoomUsers] ([RoomId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_SeminarComments_ParentId] ON [Seminar].[SeminarComments] ([ParentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_SeminarComments_SeminarId] ON [Seminar].[SeminarComments] ([SeminarId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE UNIQUE INDEX [IX_SeminarRegistrations_SeminarId_UserId] ON [Seminar].[SeminarRegistrations] ([SeminarId], [UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Seminars_RoomId] ON [Seminar].[Seminars] ([RoomId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Seminars_StartTime] ON [Seminar].[Seminars] ([StartTime]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Seminars_Status] ON [Seminar].[Seminars] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Students_EducationalProfileId] ON [Student].[Students] ([EducationalProfileId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Students_UserId] ON [Student].[Students] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Tags_ArticleId] ON [Tag].[Tags] ([ArticleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Tags_CourseId] ON [Tag].[Tags] ([CourseId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Tags_SeminarId] ON [Tag].[Tags] ([SeminarId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Tags_TagName] ON [Tag].[Tags] ([TagName]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_TeacherEducations_NameOfInstitutionOrUniversity_TypeOfDegree] ON [Teacher].[TeacherEducations] ([NameOfInstitutionOrUniversity], [TypeOfDegree]) WHERE [NameOfInstitutionOrUniversity] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_TeacherEducations_TeacherId] ON [Teacher].[TeacherEducations] ([TeacherId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_Teachers_UserId] ON [Teacher].[Teachers] ([UserId]) WHERE [UserId] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Transactions_InvoiceId] ON [Order].[Transactions] ([InvoiceId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Transactions_PaymentId] ON [Order].[Transactions] ([PaymentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_TwoFactorCodes_UserId] ON [USER].[TwoFactorCodes] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_UserClaims_ClaimType] ON [User].[UserClaims] ([ClaimType]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_UserClaims_UserId] ON [User].[UserClaims] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Users_Email] ON [User].[Users] ([Email]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Users_FirstName] ON [User].[Users] ([FirstName]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Users_LastName] ON [User].[Users] ([LastName]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Users_PhoneNumber_CountryCode] ON [User].[Users] ([PhoneNumber_CountryCode]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_Users_PhoneNumber_Number] ON [User].[Users] ([PhoneNumber_Number]) WHERE [PhoneNumber_Number] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Users_UserName] ON [User].[Users] ([UserName]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_UserSessions_UserId] ON [User].[UserSessions] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    CREATE INDEX [IX_Videos_CourseId] ON [Course].[Videos] ([CourseId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    ALTER TABLE [Article].[ArticleComments] ADD CONSTRAINT [FK_ArticleComments_Articles_ArticleId] FOREIGN KEY ([ArticleId]) REFERENCES [Article].[Articles] ([Id]) ON DELETE CASCADE;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    ALTER TABLE [Article].[Articles] ADD CONSTRAINT [FK_Articles_Categories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [Category].[Categories] ([Id]) ON DELETE SET NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260517201501_createDatabaseFirst'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260517201501_createDatabaseFirst', N'9.0.3');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522142315_changeVersion'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260522142315_changeVersion', N'9.0.3');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260528000426_createUrlIsPulic'
)
BEGIN
    ALTER TABLE [Seminar].[Seminars] ADD [IsPublic] bit NOT NULL DEFAULT CAST(1 AS bit);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260528000426_createUrlIsPulic'
)
BEGIN
    ALTER TABLE [Seminar].[Seminars] ADD [RecordingVideoUrl] nvarchar(500) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260528000426_createUrlIsPulic'
)
BEGIN
    ALTER TABLE [RoomSessions] ADD [IsIgnored] bit NOT NULL DEFAULT CAST(0 AS bit);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260528000426_createUrlIsPulic'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260528000426_createUrlIsPulic', N'9.0.3');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260611211824_AddProjects'
)
BEGIN
    IF SCHEMA_ID(N'Project') IS NULL EXEC(N'CREATE SCHEMA [Project];');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260611211824_AddProjects'
)
BEGIN
    ALTER TABLE [Tag].[Tags] ADD [ProjectId] bigint NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260611211824_AddProjects'
)
BEGIN
    ALTER TABLE [Education].[EducationPlans] ADD [EndDateUtc] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260611211824_AddProjects'
)
BEGIN
    ALTER TABLE [Education].[EducationPlans] ADD [ManagedRoomStudentId] bigint NOT NULL DEFAULT CAST(0 AS bigint);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260611211824_AddProjects'
)
BEGIN
    ALTER TABLE [Education].[EducationPlans] ADD [OwnerUserId] bigint NOT NULL DEFAULT CAST(0 AS bigint);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260611211824_AddProjects'
)
BEGIN
    ALTER TABLE [Education].[EducationPlans] ADD [RoomId] bigint NOT NULL DEFAULT CAST(0 AS bigint);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260611211824_AddProjects'
)
BEGIN
    ALTER TABLE [Education].[EducationPlans] ADD [StartDateUtc] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260611211824_AddProjects'
)
BEGIN
    ALTER TABLE [Education].[EducationPlans] ADD [UsedMinutes] int NOT NULL DEFAULT 0;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260611211824_AddProjects'
)
BEGIN
    CREATE TABLE [Education].[EducationPlanSessionUsages] (
        [Id] bigint NOT NULL IDENTITY,
        [EducationPlanId] bigint NOT NULL,
        [RoomSessionId] bigint NOT NULL,
        [MinutesConsumed] int NOT NULL,
        [ConsumedAtUtc] datetime2 NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_EducationPlanSessionUsages] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_EducationPlanSessionUsages_EducationPlans_EducationPlanId] FOREIGN KEY ([EducationPlanId]) REFERENCES [Education].[EducationPlans] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260611211824_AddProjects'
)
BEGIN
    CREATE TABLE [Website].[NotificationSettings] (
        [Id] bigint NOT NULL IDENTITY,
        [IsEnabled] bit NOT NULL,
        [ApiKey] NVARCHAR(500) NOT NULL,
        [LineNumber] bigint NOT NULL,
        [RegistrationOtpEnabled] bit NOT NULL,
        [RegistrationVerifyTemplateId] int NOT NULL,
        [PhoneChangeOtpEnabled] bit NOT NULL,
        [PhoneChangeVerifyTemplateId] int NOT NULL,
        [EducationPlanSmsEnabled] bit NOT NULL,
        [EducationPlanVerifyTemplateId] int NOT NULL,
        [EducationPlanMessageTemplate] NVARCHAR(MAX) NOT NULL,
        [OtpExpiryMinutes] int NOT NULL,
        [OtpResendCooldownSeconds] int NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_NotificationSettings] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260611211824_AddProjects'
)
BEGIN
    CREATE TABLE [Project].[Projects] (
        [Id] bigint NOT NULL IDENTITY,
        [Title] nvarchar(200) NOT NULL,
        [Slug] nvarchar(250) NOT NULL,
        [ShortDescription] nvarchar(500) NULL,
        [LongDescription] nvarchar(max) NULL,
        [ThumbnailUrl] nvarchar(500) NULL,
        [IntroVideoUrl] nvarchar(500) NULL,
        [GitHubUrl] nvarchar(500) NULL,
        [ProjectUrl] nvarchar(500) NULL,
        [TechnologiesJson] nvarchar(4000) NULL,
        [GalleryJson] nvarchar(max) NULL,
        [IsPublished] bit NOT NULL,
        [PublishedAt] datetime2 NULL,
        [AuthorUserId] bigint NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_Projects] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260611211824_AddProjects'
)
BEGIN
    CREATE INDEX [IX_Tags_ProjectId] ON [Tag].[Tags] ([ProjectId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260611211824_AddProjects'
)
BEGIN
    CREATE INDEX [IX_EducationPlans_ManagedRoomStudentId] ON [Education].[EducationPlans] ([ManagedRoomStudentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260611211824_AddProjects'
)
BEGIN
    CREATE INDEX [IX_EducationPlans_RoomId] ON [Education].[EducationPlans] ([RoomId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260611211824_AddProjects'
)
BEGIN
    CREATE UNIQUE INDEX [IX_EducationPlanSessionUsages_EducationPlanId_RoomSessionId] ON [Education].[EducationPlanSessionUsages] ([EducationPlanId], [RoomSessionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260611211824_AddProjects'
)
BEGIN
    CREATE INDEX [IX_Projects_AuthorUserId] ON [Project].[Projects] ([AuthorUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260611211824_AddProjects'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Projects_Slug] ON [Project].[Projects] ([Slug]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260611211824_AddProjects'
)
BEGIN
    ALTER TABLE [Tag].[Tags] ADD CONSTRAINT [FK_Tags_Projects_ProjectId] FOREIGN KEY ([ProjectId]) REFERENCES [Project].[Projects] ([Id]) ON DELETE SET NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260611211824_AddProjects'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260611211824_AddProjects', N'9.0.3');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260611213853_AddProjectOrders'
)
BEGIN
    IF SCHEMA_ID(N'ProjectOrder') IS NULL EXEC(N'CREATE SCHEMA [ProjectOrder];');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260611213853_AddProjectOrders'
)
BEGIN
    IF SCHEMA_ID(N'Notification') IS NULL EXEC(N'CREATE SCHEMA [Notification];');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260611213853_AddProjectOrders'
)
BEGIN
    CREATE TABLE [ProjectOrder].[ProjectOrders] (
        [Id] bigint NOT NULL IDENTITY,
        [RequestNumber] int NOT NULL,
        [UserId] bigint NOT NULL,
        [Title] nvarchar(300) NOT NULL,
        [DescriptionHtml] NVARCHAR(MAX) NOT NULL,
        [Status] tinyint NOT NULL,
        [AdminNote] nvarchar(2000) NULL,
        [ReviewedByUserId] bigint NULL,
        [ReviewedAt] datetime2 NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_ProjectOrders] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260611213853_AddProjectOrders'
)
BEGIN
    CREATE TABLE [Notification].[UserNotifications] (
        [Id] bigint NOT NULL IDENTITY,
        [UserId] bigint NOT NULL,
        [Title] nvarchar(300) NOT NULL,
        [Body] nvarchar(2000) NOT NULL,
        [Type] nvarchar(100) NOT NULL,
        [LinkUrl] nvarchar(500) NULL,
        [RelatedEntityId] bigint NULL,
        [IsRead] bit NOT NULL,
        [ReadAt] datetime2 NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_UserNotifications] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260611213853_AddProjectOrders'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ProjectOrders_RequestNumber] ON [ProjectOrder].[ProjectOrders] ([RequestNumber]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260611213853_AddProjectOrders'
)
BEGIN
    CREATE INDEX [IX_ProjectOrders_Status] ON [ProjectOrder].[ProjectOrders] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260611213853_AddProjectOrders'
)
BEGIN
    CREATE INDEX [IX_ProjectOrders_UserId] ON [ProjectOrder].[ProjectOrders] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260611213853_AddProjectOrders'
)
BEGIN
    CREATE INDEX [IX_UserNotifications_UserId_IsRead] ON [Notification].[UserNotifications] ([UserId], [IsRead]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260611213853_AddProjectOrders'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260611213853_AddProjectOrders', N'9.0.3');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260611215203_AddProjectQuestions'
)
BEGIN
    CREATE TABLE [Project].[ProjectAnswerLikes] (
        [Id] bigint NOT NULL IDENTITY,
        [AnswerId] bigint NOT NULL,
        [UserId] bigint NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_ProjectAnswerLikes] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260611215203_AddProjectQuestions'
)
BEGIN
    CREATE TABLE [Project].[ProjectQuestions] (
        [Id] bigint NOT NULL IDENTITY,
        [ProjectId] bigint NOT NULL,
        [UserId] bigint NOT NULL,
        [Subject] nvarchar(300) NULL,
        [ContentHtml] NVARCHAR(MAX) NOT NULL,
        [AudioUrl] nvarchar(500) NULL,
        [Status] tinyint NOT NULL,
        [ReviewedByUserId] bigint NULL,
        [ReviewedAt] datetime2 NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_ProjectQuestions] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260611215203_AddProjectQuestions'
)
BEGIN
    CREATE TABLE [Project].[ProjectAnswers] (
        [Id] bigint NOT NULL IDENTITY,
        [QuestionId] bigint NOT NULL,
        [UserId] bigint NOT NULL,
        [ContentHtml] NVARCHAR(MAX) NOT NULL,
        [AudioUrl] nvarchar(500) NULL,
        [LikeCount] int NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_ProjectAnswers] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ProjectAnswers_ProjectQuestions_QuestionId] FOREIGN KEY ([QuestionId]) REFERENCES [Project].[ProjectQuestions] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260611215203_AddProjectQuestions'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ProjectAnswerLikes_AnswerId_UserId] ON [Project].[ProjectAnswerLikes] ([AnswerId], [UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260611215203_AddProjectQuestions'
)
BEGIN
    CREATE INDEX [IX_ProjectAnswers_QuestionId] ON [Project].[ProjectAnswers] ([QuestionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260611215203_AddProjectQuestions'
)
BEGIN
    CREATE INDEX [IX_ProjectQuestions_ProjectId] ON [Project].[ProjectQuestions] ([ProjectId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260611215203_AddProjectQuestions'
)
BEGIN
    CREATE INDEX [IX_ProjectQuestions_Status] ON [Project].[ProjectQuestions] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260611215203_AddProjectQuestions'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260611215203_AddProjectQuestions', N'9.0.3');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260612195142_CreateComunity'
)
BEGIN
    IF SCHEMA_ID(N'Community') IS NULL EXEC(N'CREATE SCHEMA [Community];');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260612195142_CreateComunity'
)
BEGIN
    CREATE TABLE [Community].[ReplyLikes] (
        [Id] bigint NOT NULL IDENTITY,
        [ReplyId] bigint NOT NULL,
        [UserId] bigint NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_ReplyLikes] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260612195142_CreateComunity'
)
BEGIN
    CREATE TABLE [Community].[ThreadReactions] (
        [Id] bigint NOT NULL IDENTITY,
        [ThreadId] bigint NOT NULL,
        [UserId] bigint NOT NULL,
        [Reaction] int NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_ThreadReactions] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260612195142_CreateComunity'
)
BEGIN
    CREATE TABLE [Community].[Threads] (
        [Id] bigint NOT NULL IDENTITY,
        [UserId] bigint NOT NULL,
        [Subject] nvarchar(300) NULL,
        [ContentHtml] NVARCHAR(MAX) NOT NULL,
        [AudioUrl] nvarchar(500) NULL,
        [Slug] nvarchar(200) NULL,
        [ReplyCount] int NOT NULL,
        [LikeCount] int NOT NULL,
        [DislikeCount] int NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_Threads] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260612195142_CreateComunity'
)
BEGIN
    CREATE TABLE [Community].[ThreadSubscriptions] (
        [Id] bigint NOT NULL IDENTITY,
        [ThreadId] bigint NOT NULL,
        [UserId] bigint NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_ThreadSubscriptions] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260612195142_CreateComunity'
)
BEGIN
    CREATE TABLE [Community].[Replies] (
        [Id] bigint NOT NULL IDENTITY,
        [ThreadId] bigint NOT NULL,
        [UserId] bigint NOT NULL,
        [ContentHtml] NVARCHAR(MAX) NOT NULL,
        [AudioUrl] nvarchar(500) NULL,
        [LikeCount] int NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_Replies] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Replies_Threads_ThreadId] FOREIGN KEY ([ThreadId]) REFERENCES [Community].[Threads] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260612195142_CreateComunity'
)
BEGIN
    CREATE INDEX [IX_Replies_ThreadId] ON [Community].[Replies] ([ThreadId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260612195142_CreateComunity'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ReplyLikes_ReplyId_UserId] ON [Community].[ReplyLikes] ([ReplyId], [UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260612195142_CreateComunity'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ThreadReactions_ThreadId_UserId] ON [Community].[ThreadReactions] ([ThreadId], [UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260612195142_CreateComunity'
)
BEGIN
    CREATE INDEX [IX_Threads_UserId] ON [Community].[Threads] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260612195142_CreateComunity'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ThreadSubscriptions_ThreadId_UserId] ON [Community].[ThreadSubscriptions] ([ThreadId], [UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260612195142_CreateComunity'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260612195142_CreateComunity', N'9.0.3');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260616120001_FixTeacherMarketplaceAuditColumns'
)
BEGIN
    IF COL_LENGTH('Teacher.TeachingCategories', 'CreateAt') IS NOT NULL
    BEGIN
        IF COL_LENGTH('Teacher.TeachingCategories', 'CreatedByUserId') IS NULL
            ALTER TABLE [Teacher].[TeachingCategories] ADD [CreatedByUserId] nvarchar(50) NULL;

        IF COL_LENGTH('Teacher.TeachingCategories', 'CreatedDateTime') IS NULL
            ALTER TABLE [Teacher].[TeachingCategories] ADD [CreatedDateTime] datetime2 NULL;

        IF COL_LENGTH('Teacher.TeachingCategories', 'ModifiedByUserId') IS NULL
            ALTER TABLE [Teacher].[TeachingCategories] ADD [ModifiedByUserId] nvarchar(50) NULL;

        IF COL_LENGTH('Teacher.TeachingCategories', 'ModifiedDateTime') IS NULL
            ALTER TABLE [Teacher].[TeachingCategories] ADD [ModifiedDateTime] datetime2 NULL;

        UPDATE [Teacher].[TeachingCategories]
        SET [CreatedDateTime] = [CreateAt]
        WHERE [CreatedDateTime] IS NULL;

        ALTER TABLE [Teacher].[TeachingCategories] DROP COLUMN [CreateAt];
    END
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260616120001_FixTeacherMarketplaceAuditColumns'
)
BEGIN
    IF COL_LENGTH('Teacher.PromotionalVideos', 'CreateAt') IS NOT NULL
    BEGIN
        IF COL_LENGTH('Teacher.PromotionalVideos', 'CreatedByUserId') IS NULL
            ALTER TABLE [Teacher].[PromotionalVideos] ADD [CreatedByUserId] nvarchar(50) NULL;

        IF COL_LENGTH('Teacher.PromotionalVideos', 'CreatedDateTime') IS NULL
            ALTER TABLE [Teacher].[PromotionalVideos] ADD [CreatedDateTime] datetime2 NULL;

        IF COL_LENGTH('Teacher.PromotionalVideos', 'ModifiedByUserId') IS NULL
            ALTER TABLE [Teacher].[PromotionalVideos] ADD [ModifiedByUserId] nvarchar(50) NULL;

        IF COL_LENGTH('Teacher.PromotionalVideos', 'ModifiedDateTime') IS NULL
            ALTER TABLE [Teacher].[PromotionalVideos] ADD [ModifiedDateTime] datetime2 NULL;

        UPDATE [Teacher].[PromotionalVideos]
        SET [CreatedDateTime] = [CreateAt]
        WHERE [CreatedDateTime] IS NULL;

        ALTER TABLE [Teacher].[PromotionalVideos] DROP COLUMN [CreateAt];
    END
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260616120001_FixTeacherMarketplaceAuditColumns'
)
BEGIN
    IF COL_LENGTH('Teacher.Books', 'CreateAt') IS NOT NULL
    BEGIN
        IF COL_LENGTH('Teacher.Books', 'CreatedByUserId') IS NULL
            ALTER TABLE [Teacher].[Books] ADD [CreatedByUserId] nvarchar(50) NULL;

        IF COL_LENGTH('Teacher.Books', 'CreatedDateTime') IS NULL
            ALTER TABLE [Teacher].[Books] ADD [CreatedDateTime] datetime2 NULL;

        IF COL_LENGTH('Teacher.Books', 'ModifiedByUserId') IS NULL
            ALTER TABLE [Teacher].[Books] ADD [ModifiedByUserId] nvarchar(50) NULL;

        IF COL_LENGTH('Teacher.Books', 'ModifiedDateTime') IS NULL
            ALTER TABLE [Teacher].[Books] ADD [ModifiedDateTime] datetime2 NULL;

        UPDATE [Teacher].[Books]
        SET [CreatedDateTime] = [CreateAt]
        WHERE [CreatedDateTime] IS NULL;

        ALTER TABLE [Teacher].[Books] DROP COLUMN [CreateAt];
    END
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260616120001_FixTeacherMarketplaceAuditColumns'
)
BEGIN
    IF COL_LENGTH('Teacher.PortfolioArticles', 'CreateAt') IS NOT NULL
    BEGIN
        IF COL_LENGTH('Teacher.PortfolioArticles', 'CreatedByUserId') IS NULL
            ALTER TABLE [Teacher].[PortfolioArticles] ADD [CreatedByUserId] nvarchar(50) NULL;

        IF COL_LENGTH('Teacher.PortfolioArticles', 'CreatedDateTime') IS NULL
            ALTER TABLE [Teacher].[PortfolioArticles] ADD [CreatedDateTime] datetime2 NULL;

        IF COL_LENGTH('Teacher.PortfolioArticles', 'ModifiedByUserId') IS NULL
            ALTER TABLE [Teacher].[PortfolioArticles] ADD [ModifiedByUserId] nvarchar(50) NULL;

        IF COL_LENGTH('Teacher.PortfolioArticles', 'ModifiedDateTime') IS NULL
            ALTER TABLE [Teacher].[PortfolioArticles] ADD [ModifiedDateTime] datetime2 NULL;

        UPDATE [Teacher].[PortfolioArticles]
        SET [CreatedDateTime] = [CreateAt]
        WHERE [CreatedDateTime] IS NULL;

        ALTER TABLE [Teacher].[PortfolioArticles] DROP COLUMN [CreateAt];
    END
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260616120001_FixTeacherMarketplaceAuditColumns'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260616120001_FixTeacherMarketplaceAuditColumns', N'9.0.3');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260620120000_AddExamQuestionCodeFields'
)
BEGIN
    IF OBJECT_ID(N'Exam.ExamQuestions', N'U') IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'Exam.ExamQuestions') AND name = N'CodeSnippet'
    )
    BEGIN
        ALTER TABLE Exam.ExamQuestions ADD CodeSnippet NVARCHAR(MAX) NULL;
    END
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260620120000_AddExamQuestionCodeFields'
)
BEGIN
    IF OBJECT_ID(N'Exam.ExamQuestions', N'U') IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'Exam.ExamQuestions') AND name = N'CodeLanguage'
    )
    BEGIN
        ALTER TABLE Exam.ExamQuestions ADD CodeLanguage NVARCHAR(50) NULL;
    END
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260620120000_AddExamQuestionCodeFields'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260620120000_AddExamQuestionCodeFields', N'9.0.3');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260809120000_FixMediaAssetsAuditColumns'
)
BEGIN
    IF OBJECT_ID(N'[Media].[MediaAssets]', N'U') IS NULL
        RETURN;

    IF COL_LENGTH('Media.MediaAssets', 'BusinessId') IS NULL
        ALTER TABLE [Media].[MediaAssets] ADD [BusinessId] uniqueidentifier NOT NULL DEFAULT NEWID();

    IF COL_LENGTH('Media.MediaAssets', 'CreatedByUserId') IS NULL
        ALTER TABLE [Media].[MediaAssets] ADD [CreatedByUserId] nvarchar(50) NULL;

    IF COL_LENGTH('Media.MediaAssets', 'ModifiedByUserId') IS NULL
        ALTER TABLE [Media].[MediaAssets] ADD [ModifiedByUserId] nvarchar(50) NULL;

    IF COL_LENGTH('Media.MediaAssets', 'CreatedDateTime') IS NULL
    BEGIN
        IF COL_LENGTH('Media.MediaAssets', 'CreatedAtUtc') IS NOT NULL
            EXEC sp_rename 'Media.MediaAssets.CreatedAtUtc', 'CreatedDateTime', 'COLUMN';
        ELSE
            ALTER TABLE [Media].[MediaAssets] ADD [CreatedDateTime] datetime2 NULL;
    END

    IF COL_LENGTH('Media.MediaAssets', 'ModifiedDateTime') IS NULL
    BEGIN
        IF COL_LENGTH('Media.MediaAssets', 'UpdatedAtUtc') IS NOT NULL
            EXEC sp_rename 'Media.MediaAssets.UpdatedAtUtc', 'ModifiedDateTime', 'COLUMN';
        ELSE
            ALTER TABLE [Media].[MediaAssets] ADD [ModifiedDateTime] datetime2 NULL;
    END

    IF COL_LENGTH('Media.MediaAssets', 'IsDeleted') IS NULL
    BEGIN
        IF COL_LENGTH('Media.MediaAssets', 'IsDelete') IS NOT NULL
            EXEC sp_rename 'Media.MediaAssets.IsDelete', 'IsDeleted', 'COLUMN';
        ELSE
            ALTER TABLE [Media].[MediaAssets] ADD [IsDeleted] bit NOT NULL CONSTRAINT [DF_MediaAssets_IsDeleted] DEFAULT(0);
    END

    IF COL_LENGTH('Media.MediaAssets', 'ApprovalStatus') IS NULL
        ALTER TABLE [Media].[MediaAssets] ADD [ApprovalStatus] int NOT NULL CONSTRAINT [DF_MediaAssets_ApprovalStatus] DEFAULT(1);

    IF COL_LENGTH('Media.MediaAssets', 'RejectionReason') IS NULL
        ALTER TABLE [Media].[MediaAssets] ADD [RejectionReason] nvarchar(1000) NULL;

    IF COL_LENGTH('Media.MediaAssets', 'IsRejectionDismissed') IS NULL
        ALTER TABLE [Media].[MediaAssets] ADD [IsRejectionDismissed] bit NOT NULL CONSTRAINT [DF_MediaAssets_IsRejectionDismissed] DEFAULT(0);

    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MediaAssets_IsDeleted_CreatedAtUtc' AND object_id = OBJECT_ID('[Media].[MediaAssets]'))
        DROP INDEX [IX_MediaAssets_IsDeleted_CreatedAtUtc] ON [Media].[MediaAssets];

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MediaAssets_IsDeleted_ApprovalStatus' AND object_id = OBJECT_ID('[Media].[MediaAssets]'))
       AND COL_LENGTH('Media.MediaAssets', 'IsDeleted') IS NOT NULL
       AND COL_LENGTH('Media.MediaAssets', 'ApprovalStatus') IS NOT NULL
        CREATE INDEX [IX_MediaAssets_IsDeleted_ApprovalStatus] ON [Media].[MediaAssets] ([IsDeleted], [ApprovalStatus]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260809120000_FixMediaAssetsAuditColumns'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260809120000_FixMediaAssetsAuditColumns', N'9.0.3');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810120000_EnsureMediaAssetsSchemaComplete'
)
BEGIN
    IF SCHEMA_ID(N'Media') IS NULL
        EXEC(N'CREATE SCHEMA [Media]');

    IF OBJECT_ID(N'[Media].[MediaAssets]', N'U') IS NULL
    BEGIN
        CREATE TABLE [Media].[MediaAssets] (
            [Id] bigint NOT NULL IDENTITY,
            [OwnerUserId] bigint NOT NULL,
            [FileUrl] nvarchar(500) NOT NULL,
            [OriginalFileName] nvarchar(260) NOT NULL,
            [MimeType] nvarchar(100) NOT NULL,
            [FileSizeBytes] bigint NOT NULL,
            [MediaType] int NOT NULL,
            [Title] nvarchar(200) NULL,
            [AltText] nvarchar(500) NULL,
            [Caption] nvarchar(1000) NULL,
            [Description] nvarchar(2000) NULL,
            [Width] int NULL,
            [Height] int NULL,
            [ApprovalStatus] int NOT NULL CONSTRAINT [DF_MediaAssets_ApprovalStatus_v2] DEFAULT(1),
            [RejectionReason] nvarchar(1000) NULL,
            [IsRejectionDismissed] bit NOT NULL CONSTRAINT [DF_MediaAssets_IsRejectionDismissed_v2] DEFAULT(0),
            [CreatedByUserId] nvarchar(50) NULL,
            [CreatedDateTime] datetime2 NULL,
            [ModifiedByUserId] nvarchar(50) NULL,
            [ModifiedDateTime] datetime2 NULL,
            [IsDeleted] bit NOT NULL CONSTRAINT [DF_MediaAssets_IsDeleted_v2] DEFAULT(0),
            [BusinessId] uniqueidentifier NOT NULL CONSTRAINT [DF_MediaAssets_BusinessId_v2] DEFAULT NEWID(),
            CONSTRAINT [PK_MediaAssets] PRIMARY KEY ([Id]),
            CONSTRAINT [AK_MediaAssets_BusinessId] UNIQUE ([BusinessId])
        );
        CREATE INDEX [IX_MediaAssets_OwnerUserId] ON [Media].[MediaAssets] ([OwnerUserId]);
        CREATE INDEX [IX_MediaAssets_IsDeleted_ApprovalStatus] ON [Media].[MediaAssets] ([IsDeleted], [ApprovalStatus]);
    END
    ELSE
    BEGIN
        IF COL_LENGTH('Media.MediaAssets', 'BusinessId') IS NULL
            ALTER TABLE [Media].[MediaAssets] ADD [BusinessId] uniqueidentifier NOT NULL CONSTRAINT [DF_MediaAssets_BusinessId_fix] DEFAULT NEWID();

        IF COL_LENGTH('Media.MediaAssets', 'CreatedByUserId') IS NULL
            ALTER TABLE [Media].[MediaAssets] ADD [CreatedByUserId] nvarchar(50) NULL;

        IF COL_LENGTH('Media.MediaAssets', 'ModifiedByUserId') IS NULL
            ALTER TABLE [Media].[MediaAssets] ADD [ModifiedByUserId] nvarchar(50) NULL;

        IF COL_LENGTH('Media.MediaAssets', 'CreatedDateTime') IS NULL
        BEGIN
            IF COL_LENGTH('Media.MediaAssets', 'CreatedAtUtc') IS NOT NULL
                EXEC sp_rename 'Media.MediaAssets.CreatedAtUtc', 'CreatedDateTime', 'COLUMN';
            ELSE
                ALTER TABLE [Media].[MediaAssets] ADD [CreatedDateTime] datetime2 NULL;
        END

        IF COL_LENGTH('Media.MediaAssets', 'ModifiedDateTime') IS NULL
        BEGIN
            IF COL_LENGTH('Media.MediaAssets', 'UpdatedAtUtc') IS NOT NULL
                EXEC sp_rename 'Media.MediaAssets.UpdatedAtUtc', 'ModifiedDateTime', 'COLUMN';
            ELSE
                ALTER TABLE [Media].[MediaAssets] ADD [ModifiedDateTime] datetime2 NULL;
        END

        IF COL_LENGTH('Media.MediaAssets', 'IsDeleted') IS NULL
        BEGIN
            IF COL_LENGTH('Media.MediaAssets', 'IsDelete') IS NOT NULL
                EXEC sp_rename 'Media.MediaAssets.IsDelete', 'IsDeleted', 'COLUMN';
            ELSE
                ALTER TABLE [Media].[MediaAssets] ADD [IsDeleted] bit NOT NULL CONSTRAINT [DF_MediaAssets_IsDeleted_fix] DEFAULT(0);
        END

        IF COL_LENGTH('Media.MediaAssets', 'ApprovalStatus') IS NULL
            ALTER TABLE [Media].[MediaAssets] ADD [ApprovalStatus] int NOT NULL CONSTRAINT [DF_MediaAssets_ApprovalStatus_fix] DEFAULT(1);

        IF COL_LENGTH('Media.MediaAssets', 'RejectionReason') IS NULL
            ALTER TABLE [Media].[MediaAssets] ADD [RejectionReason] nvarchar(1000) NULL;

        IF COL_LENGTH('Media.MediaAssets', 'IsRejectionDismissed') IS NULL
            ALTER TABLE [Media].[MediaAssets] ADD [IsRejectionDismissed] bit NOT NULL CONSTRAINT [DF_MediaAssets_IsRejectionDismissed_fix] DEFAULT(0);

        IF COL_LENGTH('Media.MediaAssets', 'CreatedAtUtc') IS NOT NULL
            ALTER TABLE [Media].[MediaAssets] DROP COLUMN [CreatedAtUtc];

        IF COL_LENGTH('Media.MediaAssets', 'UpdatedAtUtc') IS NOT NULL
            ALTER TABLE [Media].[MediaAssets] DROP COLUMN [UpdatedAtUtc];

        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MediaAssets_IsDeleted_ApprovalStatus' AND object_id = OBJECT_ID('[Media].[MediaAssets]'))
           AND COL_LENGTH('Media.MediaAssets', 'IsDeleted') IS NOT NULL
           AND COL_LENGTH('Media.MediaAssets', 'ApprovalStatus') IS NOT NULL
            CREATE INDEX [IX_MediaAssets_IsDeleted_ApprovalStatus] ON [Media].[MediaAssets] ([IsDeleted], [ApprovalStatus]);
    END
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810120000_EnsureMediaAssetsSchemaComplete'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260810120000_EnsureMediaAssetsSchemaComplete', N'9.0.3');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260811130000_BackfillMediaAssetsAuditDates'
)
BEGIN
    IF OBJECT_ID(N'[Media].[MediaAssets]', N'U') IS NOT NULL
    BEGIN
        UPDATE [Media].[MediaAssets]
        SET [CreatedDateTime] = SYSUTCDATETIME()
        WHERE [CreatedDateTime] IS NULL;

        UPDATE [Media].[MediaAssets]
        SET [ModifiedDateTime] = COALESCE([ModifiedDateTime], [CreatedDateTime], SYSUTCDATETIME())
        WHERE [ModifiedDateTime] IS NULL;
    END
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260811130000_BackfillMediaAssetsAuditDates'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260811130000_BackfillMediaAssetsAuditDates', N'9.0.3');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260811140000_FixSupportSubscriptionIdentityColumns'
)
BEGIN
    IF OBJECT_ID(N'[Support].[SupportPlanTariffs]', N'U') IS NOT NULL
    AND EXISTS (
        SELECT 1
        FROM sys.columns c
        INNER JOIN sys.tables t ON c.object_id = t.object_id
        INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
        WHERE s.name = N'Support'
          AND t.name = N'SupportPlanTariffs'
          AND c.name = N'Id'
          AND c.is_identity = 0
    )
    BEGIN
        IF EXISTS (SELECT 1 FROM [Support].[StudentSupportSubscriptions])
            OR EXISTS (SELECT 1 FROM [Support].[StudentSupportFreezeRecords])
            RAISERROR(
                N'Support subscription tables contain data but Id columns lack IDENTITY. Manual migration required.',
                16,
                1);

        IF OBJECT_ID(N'[Support].[StudentSupportFreezeRecords]', N'U') IS NOT NULL
            DROP TABLE [Support].[StudentSupportFreezeRecords];

        IF OBJECT_ID(N'[Support].[StudentSupportSubscriptions]', N'U') IS NOT NULL
            DROP TABLE [Support].[StudentSupportSubscriptions];

        DROP TABLE [Support].[SupportPlanTariffs];
    END

    IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'Support')
        EXEC(N'CREATE SCHEMA [Support]');

    IF OBJECT_ID(N'[Support].[SupportPlanTariffs]', N'U') IS NULL
    BEGIN
        CREATE TABLE [Support].[SupportPlanTariffs] (
            [Id] bigint NOT NULL IDENTITY(1, 1),
            [BusinessId] uniqueidentifier NOT NULL,
            [DurationMonths] int NOT NULL,
            [PriceToman] bigint NOT NULL,
            [IsActive] bit NOT NULL,
            [SortOrder] int NOT NULL,
            [CreatedByUserId] nvarchar(50) NULL,
            [CreatedDateTime] datetime2 NOT NULL,
            [ModifiedByUserId] nvarchar(50) NULL,
            [ModifiedDateTime] datetime2 NULL,
            [IsDelete] bit NOT NULL,
            CONSTRAINT [PK_SupportPlanTariffs] PRIMARY KEY ([Id]),
            CONSTRAINT [AK_SupportPlanTariffs_BusinessId] UNIQUE ([BusinessId])
        );

        CREATE UNIQUE INDEX [IX_SupportPlanTariffs_DurationMonths]
            ON [Support].[SupportPlanTariffs] ([DurationMonths]);
    END

    IF OBJECT_ID(N'[Support].[StudentSupportSubscriptions]', N'U') IS NULL
    BEGIN
        CREATE TABLE [Support].[StudentSupportSubscriptions] (
            [Id] bigint NOT NULL IDENTITY(1, 1),
            [BusinessId] uniqueidentifier NOT NULL,
            [StudentUserId] bigint NOT NULL,
            [AccessEndsAtUtc] datetime2 NULL,
            [FreezeCountUsed] int NOT NULL,
            [FrozenUntilUtc] datetime2 NULL,
            [ActiveFreezeReason] nvarchar(500) NULL,
            [RemainingSecondsWhileFrozen] int NULL,
            [FrozenStartedAtUtc] datetime2 NULL,
            [UpdatedAtUtc] datetime2 NOT NULL,
            [CreatedByUserId] nvarchar(50) NULL,
            [CreatedDateTime] datetime2 NOT NULL,
            [ModifiedByUserId] nvarchar(50) NULL,
            [ModifiedDateTime] datetime2 NULL,
            [IsDelete] bit NOT NULL,
            CONSTRAINT [PK_StudentSupportSubscriptions] PRIMARY KEY ([Id]),
            CONSTRAINT [AK_StudentSupportSubscriptions_BusinessId] UNIQUE ([BusinessId])
        );

        CREATE UNIQUE INDEX [IX_StudentSupportSubscriptions_StudentUserId]
            ON [Support].[StudentSupportSubscriptions] ([StudentUserId]);
    END

    IF OBJECT_ID(N'[Support].[StudentSupportFreezeRecords]', N'U') IS NULL
    BEGIN
        CREATE TABLE [Support].[StudentSupportFreezeRecords] (
            [Id] bigint NOT NULL IDENTITY(1, 1),
            [BusinessId] uniqueidentifier NOT NULL,
            [StudentUserId] bigint NOT NULL,
            [StudentSupportSubscriptionId] bigint NOT NULL,
            [StartedAtUtc] datetime2 NOT NULL,
            [EndsAtUtc] datetime2 NOT NULL,
            [DurationDays] int NOT NULL,
            [Reason] nvarchar(500) NOT NULL,
            [CreatedByUserId] nvarchar(50) NULL,
            [CreatedDateTime] datetime2 NOT NULL,
            [ModifiedByUserId] nvarchar(50) NULL,
            [ModifiedDateTime] datetime2 NULL,
            [IsDelete] bit NOT NULL,
            CONSTRAINT [PK_StudentSupportFreezeRecords] PRIMARY KEY ([Id]),
            CONSTRAINT [AK_StudentSupportFreezeRecords_BusinessId] UNIQUE ([BusinessId]),
            CONSTRAINT [FK_StudentSupportFreezeRecords_StudentSupportSubscriptions_StudentSupportSubscriptionId]
                FOREIGN KEY ([StudentSupportSubscriptionId])
                REFERENCES [Support].[StudentSupportSubscriptions] ([Id])
                ON DELETE CASCADE
        );

        CREATE INDEX [IX_StudentSupportFreezeRecords_StudentUserId]
            ON [Support].[StudentSupportFreezeRecords] ([StudentUserId]);
    END

    IF NOT EXISTS (SELECT 1 FROM [Support].[SupportPlanTariffs])
    BEGIN
        INSERT INTO [Support].[SupportPlanTariffs]
            ([DurationMonths],[PriceToman],[IsActive],[SortOrder],[CreatedDateTime],[IsDelete],[BusinessId])
        VALUES
            (1, 500000, 1, 1, SYSUTCDATETIME(), 0, NEWID()),
            (3, 1200000, 1, 2, SYSUTCDATETIME(), 0, NEWID()),
            (6, 2000000, 1, 3, SYSUTCDATETIME(), 0, NEWID());
    END
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260811140000_FixSupportSubscriptionIdentityColumns'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260811140000_FixSupportSubscriptionIdentityColumns', N'9.0.3');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260811150000_FixSupportSubscriptionAuditColumns'
)
BEGIN
    IF OBJECT_ID(N'[Support].[SupportPlanTariffs]', N'U') IS NOT NULL
    BEGIN
        IF COL_LENGTH('Support.SupportPlanTariffs', 'CreatedByUserId') IS NOT NULL
            ALTER TABLE [Support].[SupportPlanTariffs] ALTER COLUMN [CreatedByUserId] nvarchar(50) NULL;

        IF COL_LENGTH('Support.SupportPlanTariffs', 'ModifiedByUserId') IS NOT NULL
            ALTER TABLE [Support].[SupportPlanTariffs] ALTER COLUMN [ModifiedByUserId] nvarchar(50) NULL;
    END
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260811150000_FixSupportSubscriptionAuditColumns'
)
BEGIN
    IF OBJECT_ID(N'[Support].[StudentSupportSubscriptions]', N'U') IS NOT NULL
    BEGIN
        IF COL_LENGTH('Support.StudentSupportSubscriptions', 'CreatedByUserId') IS NOT NULL
            ALTER TABLE [Support].[StudentSupportSubscriptions] ALTER COLUMN [CreatedByUserId] nvarchar(50) NULL;

        IF COL_LENGTH('Support.StudentSupportSubscriptions', 'ModifiedByUserId') IS NOT NULL
            ALTER TABLE [Support].[StudentSupportSubscriptions] ALTER COLUMN [ModifiedByUserId] nvarchar(50) NULL;
    END
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260811150000_FixSupportSubscriptionAuditColumns'
)
BEGIN
    IF OBJECT_ID(N'[Support].[StudentSupportFreezeRecords]', N'U') IS NOT NULL
    BEGIN
        IF COL_LENGTH('Support.StudentSupportFreezeRecords', 'CreatedByUserId') IS NOT NULL
            ALTER TABLE [Support].[StudentSupportFreezeRecords] ALTER COLUMN [CreatedByUserId] nvarchar(50) NULL;

        IF COL_LENGTH('Support.StudentSupportFreezeRecords', 'ModifiedByUserId') IS NOT NULL
            ALTER TABLE [Support].[StudentSupportFreezeRecords] ALTER COLUMN [ModifiedByUserId] nvarchar(50) NULL;
    END
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260811150000_FixSupportSubscriptionAuditColumns'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260811150000_FixSupportSubscriptionAuditColumns', N'9.0.3');
END;

COMMIT;
GO

