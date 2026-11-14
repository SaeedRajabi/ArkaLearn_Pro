-- Promotional video engagement: view/like counts + likes + comments
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[Teacher].[PromotionalVideos]') AND name = 'ViewCount'
)
BEGIN
    ALTER TABLE [Teacher].[PromotionalVideos] ADD [ViewCount] INT NOT NULL CONSTRAINT [DF_PromotionalVideos_ViewCount] DEFAULT 0;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[Teacher].[PromotionalVideos]') AND name = 'LikeCount'
)
BEGIN
    ALTER TABLE [Teacher].[PromotionalVideos] ADD [LikeCount] INT NOT NULL CONSTRAINT [DF_PromotionalVideos_LikeCount] DEFAULT 0;
END
GO

IF OBJECT_ID(N'[Teacher].[PromotionalVideoLikes]', N'U') IS NULL
BEGIN
    CREATE TABLE [Teacher].[PromotionalVideoLikes] (
        [Id] bigint IDENTITY(1,1) NOT NULL,
        [VideoId] bigint NOT NULL,
        [UserId] bigint NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL DEFAULT 0,
        [BusinessId] uniqueidentifier NOT NULL DEFAULT NEWID(),
        CONSTRAINT [PK_PromotionalVideoLikes] PRIMARY KEY ([Id])
    );
    CREATE UNIQUE INDEX [IX_PromotionalVideoLikes_VideoId_UserId] ON [Teacher].[PromotionalVideoLikes] ([VideoId], [UserId]);
END
GO

IF OBJECT_ID(N'[Teacher].[PromotionalVideoComments]', N'U') IS NULL
BEGIN
    CREATE TABLE [Teacher].[PromotionalVideoComments] (
        [Id] bigint IDENTITY(1,1) NOT NULL,
        [VideoId] bigint NOT NULL,
        [UserId] bigint NOT NULL,
        [Content] nvarchar(2000) NOT NULL,
        [ParentId] bigint NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL DEFAULT 0,
        [BusinessId] uniqueidentifier NOT NULL DEFAULT NEWID(),
        CONSTRAINT [PK_PromotionalVideoComments] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_PromotionalVideoComments_VideoId] ON [Teacher].[PromotionalVideoComments] ([VideoId]);
    CREATE INDEX [IX_PromotionalVideoComments_ParentId] ON [Teacher].[PromotionalVideoComments] ([ParentId]);
END
GO
