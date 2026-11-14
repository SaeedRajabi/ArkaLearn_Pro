BEGIN TRANSACTION;
GO

-- 1. TeachingCategories
CREATE TABLE [Teacher].[TeachingCategories] (
    [Id] bigint IDENTITY(1,1) NOT NULL,
    [Name] nvarchar(200) NOT NULL,
    [Slug] nvarchar(200) NOT NULL,
    [Description] nvarchar(1000) NULL,
    [IsActive] bit NOT NULL,
    [SortOrder] int NOT NULL,
    [CreatedByUserId] nvarchar(50) NULL,
    [CreatedDateTime] datetime2 NULL,
    [ModifiedByUserId] nvarchar(50) NULL,
    [ModifiedDateTime] datetime2 NULL,
    [IsDelete] bit NOT NULL,
    [BusinessId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_TeachingCategories] PRIMARY KEY ([Id])
);
GO

CREATE UNIQUE INDEX [IX_TeachingCategories_Slug] 
ON [Teacher].[TeachingCategories] ([Slug]);
GO

-- 2. Teachers marketplace columns
ALTER TABLE [Teacher].[Teachers] ADD [ShortDescription] nvarchar(500) NULL;
ALTER TABLE [Teacher].[Teachers] ADD [HeaderImageUrl] nvarchar(2000) NULL;
ALTER TABLE [Teacher].[Teachers] ADD [TeachingCategoryId] bigint NULL;
ALTER TABLE [Teacher].[Teachers] ADD [AdvertisingPlan] tinyint NOT NULL DEFAULT CAST(0 AS tinyint);
ALTER TABLE [Teacher].[Teachers] ADD [ProfileApprovalStatus] tinyint NOT NULL DEFAULT CAST(0 AS tinyint);
ALTER TABLE [Teacher].[Teachers] ADD [ProfileRejectionNote] nvarchar(2000) NULL;
ALTER TABLE [Teacher].[Teachers] ADD [SubmittedAtUtc] datetime2 NULL;
ALTER TABLE [Teacher].[Teachers] ADD [ApprovedAtUtc] datetime2 NULL;
GO

CREATE INDEX [IX_Teachers_TeachingCategoryId] 
ON [Teacher].[Teachers] ([TeachingCategoryId]);
GO

ALTER TABLE [Teacher].[Teachers] 
ADD CONSTRAINT [FK_Teachers_TeachingCategories_TeachingCategoryId] 
FOREIGN KEY ([TeachingCategoryId]) REFERENCES [Teacher].[TeachingCategories] ([Id]) ON DELETE SET NULL;
GO

-- 3. PromotionalVideos
CREATE TABLE [Teacher].[PromotionalVideos] (
    [Id] bigint IDENTITY(1,1) NOT NULL,
    [TeacherId] bigint NOT NULL,
    [Title] nvarchar(300) NOT NULL,
    [VideoUrl] nvarchar(2000) NOT NULL,
    [ThumbnailUrl] nvarchar(2000) NULL,
    [ApprovalStatus] tinyint NOT NULL,
    [SortOrder] int NOT NULL,
    [CreatedByUserId] nvarchar(50) NULL,
    [CreatedDateTime] datetime2 NULL,
    [ModifiedByUserId] nvarchar(50) NULL,
    [ModifiedDateTime] datetime2 NULL,
    [IsDelete] bit NOT NULL,
    [BusinessId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_PromotionalVideos] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_PromotionalVideos_Teachers_TeacherId] FOREIGN KEY ([TeacherId]) REFERENCES [Teacher].[Teachers] ([Id]) ON DELETE CASCADE
);
GO

-- 4. Books
CREATE TABLE [Teacher].[Books] (
    [Id] bigint IDENTITY(1,1) NOT NULL,
    [TeacherId] bigint NOT NULL,
    [Title] nvarchar(300) NOT NULL,
    [Description] nvarchar(4000) NOT NULL,
    [CoverImageUrl] nvarchar(2000) NULL,
    [ApprovalStatus] tinyint NOT NULL,
    [SortOrder] int NOT NULL,
    [CreatedByUserId] nvarchar(50) NULL,
    [CreatedDateTime] datetime2 NULL,
    [ModifiedByUserId] nvarchar(50) NULL,
    [ModifiedDateTime] datetime2 NULL,
    [IsDelete] bit NOT NULL,
    [BusinessId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_Books] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Books_Teachers_TeacherId] FOREIGN KEY ([TeacherId]) REFERENCES [Teacher].[Teachers] ([Id]) ON DELETE CASCADE
);
GO

-- 5. PortfolioArticles
CREATE TABLE [Teacher].[PortfolioArticles] (
    [Id] bigint IDENTITY(1,1) NOT NULL,
    [TeacherId] bigint NOT NULL,
    [Title] nvarchar(300) NOT NULL,
    [Summary] nvarchar(1000) NOT NULL,
    [Content] NVARCHAR(MAX) NOT NULL,
    [ApprovalStatus] tinyint NOT NULL,
    [SortOrder] int NOT NULL,
    [CreatedByUserId] nvarchar(50) NULL,
    [CreatedDateTime] datetime2 NULL,
    [ModifiedByUserId] nvarchar(50) NULL,
    [ModifiedDateTime] datetime2 NULL,
    [IsDelete] bit NOT NULL,
    [BusinessId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_PortfolioArticles] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_PortfolioArticles_Teachers_TeacherId] FOREIGN KEY ([TeacherId]) REFERENCES [Teacher].[Teachers] ([Id]) ON DELETE CASCADE
);
GO

-- 6. Seed data
INSERT INTO [Teacher].[TeachingCategories] ([Name], [Slug], [Description], [IsActive], [SortOrder], [CreatedDateTime], [IsDelete], [BusinessId])
VALUES 
('Programming', 'programming', 'Software and programming instructors', 1, 1, GETUTCDATE(), 0, NEWID()),
('English', 'english', 'English language instructors', 1, 2, GETUTCDATE(), 0, NEWID()),
('Mathematics', 'mathematics', 'Mathematics instructors', 1, 3, GETUTCDATE(), 0, NEWID()),
('Science', 'science', 'Science instructors', 1, 4, GETUTCDATE(), 0, NEWID()),
('Art & Design', 'art-design', 'Art and design instructors', 1, 5, GETUTCDATE(), 0, NEWID());
GO

COMMIT TRANSACTION;
GO
