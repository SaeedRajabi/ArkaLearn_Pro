IF SCHEMA_ID(N'Calendar') IS NULL EXEC(N'CREATE SCHEMA [Calendar];');

IF OBJECT_ID(N'[Calendar].[CalendarEvents]', N'U') IS NULL
BEGIN
    CREATE TABLE [Calendar].[CalendarEvents] (
        [Id] bigint NOT NULL IDENTITY(1, 1),
        [Title] nvarchar(200) NOT NULL,
        [Category] int NOT NULL,
        [StartUtc] datetime2 NOT NULL,
        [EndUtc] datetime2 NOT NULL,
        [IsAllDay] bit NOT NULL DEFAULT 0,
        [EventUrl] nvarchar(500) NULL,
        [Description] nvarchar(4000) NULL,
        [OwnerUserId] bigint NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_CalendarEvents] PRIMARY KEY ([Id]),
        CONSTRAINT [AK_CalendarEvents_BusinessId] UNIQUE ([BusinessId])
    );
    CREATE INDEX [IX_CalendarEvents_OwnerUserId] ON [Calendar].[CalendarEvents] ([OwnerUserId]);
    CREATE INDEX [IX_CalendarEvents_IsDelete_StartUtc_EndUtc] ON [Calendar].[CalendarEvents] ([IsDelete], [StartUtc], [EndUtc]);
END

IF OBJECT_ID(N'[Calendar].[CalendarEventParticipants]', N'U') IS NULL
BEGIN
    CREATE TABLE [Calendar].[CalendarEventParticipants] (
        [Id] bigint NOT NULL IDENTITY(1, 1),
        [CalendarEventId] bigint NOT NULL,
        [UserId] bigint NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_CalendarEventParticipants] PRIMARY KEY ([Id]),
        CONSTRAINT [AK_CalendarEventParticipants_BusinessId] UNIQUE ([BusinessId]),
        CONSTRAINT [FK_CalendarEventParticipants_CalendarEvents_CalendarEventId]
            FOREIGN KEY ([CalendarEventId]) REFERENCES [Calendar].[CalendarEvents] ([Id]) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX [IX_CalendarEventParticipants_CalendarEventId_UserId]
        ON [Calendar].[CalendarEventParticipants] ([CalendarEventId], [UserId]);
    CREATE INDEX [IX_CalendarEventParticipants_UserId] ON [Calendar].[CalendarEventParticipants] ([UserId]);
END

IF OBJECT_ID(N'[Calendar].[CalendarEventReminderDispatches]', N'U') IS NULL
BEGIN
    CREATE TABLE [Calendar].[CalendarEventReminderDispatches] (
        [Id] bigint NOT NULL IDENTITY(1, 1),
        [CalendarEventId] bigint NOT NULL,
        [UserId] bigint NOT NULL,
        [ReminderType] int NOT NULL,
        [SentAtUtc] datetime2 NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_CalendarEventReminderDispatches] PRIMARY KEY ([Id]),
        CONSTRAINT [AK_CalendarEventReminderDispatches_BusinessId] UNIQUE ([BusinessId])
    );
    CREATE UNIQUE INDEX [IX_CalendarEventReminderDispatches_CalendarEventId_UserId_ReminderType]
        ON [Calendar].[CalendarEventReminderDispatches] ([CalendarEventId], [UserId], [ReminderType]);
END
