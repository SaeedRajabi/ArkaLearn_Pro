using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

/// <inheritdoc />
public partial class ExpandRemoteAssistSessions : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            IF COL_LENGTH('Desktop.RemoteAssistSessions', 'SessionUsername') IS NULL
            BEGIN
                ALTER TABLE [Desktop].[RemoteAssistSessions]
                ADD [SessionUsername] nvarchar(64) NOT NULL CONSTRAINT DF_RemoteAssistSessions_SessionUsername DEFAULT(N'');
            END

            IF COL_LENGTH('Desktop.RemoteAssistSessions', 'ConsentRequestedAtUtc') IS NULL
            BEGIN
                ALTER TABLE [Desktop].[RemoteAssistSessions]
                ADD [ConsentRequestedAtUtc] datetime2 NULL;
            END

            IF COL_LENGTH('Desktop.RemoteAssistSessions', 'AllowRemoteControl') IS NULL
            BEGIN
                ALTER TABLE [Desktop].[RemoteAssistSessions]
                ADD [AllowRemoteControl] bit NOT NULL CONSTRAINT DF_RemoteAssistSessions_AllowRemoteControl DEFAULT(1);
            END

            IF COL_LENGTH('Desktop.RemoteAssistSessions', 'AllowClipboard') IS NULL
            BEGIN
                ALTER TABLE [Desktop].[RemoteAssistSessions]
                ADD [AllowClipboard] bit NOT NULL CONSTRAINT DF_RemoteAssistSessions_AllowClipboard DEFAULT(0);
            END

            IF COL_LENGTH('Desktop.RemoteAssistSessions', 'AllowFileTransfer') IS NULL
            BEGIN
                ALTER TABLE [Desktop].[RemoteAssistSessions]
                ADD [AllowFileTransfer] bit NOT NULL CONSTRAINT DF_RemoteAssistSessions_AllowFileTransfer DEFAULT(0);
            END

            IF COL_LENGTH('Desktop.RemoteAssistSessions', 'AllowAudio') IS NULL
            BEGIN
                ALTER TABLE [Desktop].[RemoteAssistSessions]
                ADD [AllowAudio] bit NOT NULL CONSTRAINT DF_RemoteAssistSessions_AllowAudio DEFAULT(0);
            END

            IF COL_LENGTH('Desktop.RemoteAssistSessions', 'AllowLockLocalInput') IS NULL
            BEGIN
                ALTER TABLE [Desktop].[RemoteAssistSessions]
                ADD [AllowLockLocalInput] bit NOT NULL CONSTRAINT DF_RemoteAssistSessions_AllowLockLocalInput DEFAULT(0);
            END

            IF NOT EXISTS (
                SELECT 1 FROM sys.indexes
                WHERE name = N'IX_RemoteAssistSessions_SessionUsername'
                  AND object_id = OBJECT_ID(N'Desktop.RemoteAssistSessions'))
            BEGIN
                CREATE INDEX [IX_RemoteAssistSessions_SessionUsername]
                ON [Desktop].[RemoteAssistSessions] ([SessionUsername]);
            END

            -- Backfill usernames for existing rows
            UPDATE s
            SET SessionUsername = LOWER(N'arka' + CAST(RequesterUserId AS nvarchar(20)) + N'x')
            FROM [Desktop].[RemoteAssistSessions] s
            WHERE SessionUsername = N'' OR SessionUsername IS NULL;
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            IF EXISTS (
                SELECT 1 FROM sys.indexes
                WHERE name = N'IX_RemoteAssistSessions_SessionUsername'
                  AND object_id = OBJECT_ID(N'Desktop.RemoteAssistSessions'))
                DROP INDEX [IX_RemoteAssistSessions_SessionUsername] ON [Desktop].[RemoteAssistSessions];

            IF COL_LENGTH('Desktop.RemoteAssistSessions', 'AllowLockLocalInput') IS NOT NULL
                ALTER TABLE [Desktop].[RemoteAssistSessions] DROP COLUMN [AllowLockLocalInput];
            IF COL_LENGTH('Desktop.RemoteAssistSessions', 'AllowAudio') IS NOT NULL
                ALTER TABLE [Desktop].[RemoteAssistSessions] DROP COLUMN [AllowAudio];
            IF COL_LENGTH('Desktop.RemoteAssistSessions', 'AllowFileTransfer') IS NOT NULL
                ALTER TABLE [Desktop].[RemoteAssistSessions] DROP COLUMN [AllowFileTransfer];
            IF COL_LENGTH('Desktop.RemoteAssistSessions', 'AllowClipboard') IS NOT NULL
                ALTER TABLE [Desktop].[RemoteAssistSessions] DROP COLUMN [AllowClipboard];
            IF COL_LENGTH('Desktop.RemoteAssistSessions', 'AllowRemoteControl') IS NOT NULL
                ALTER TABLE [Desktop].[RemoteAssistSessions] DROP COLUMN [AllowRemoteControl];
            IF COL_LENGTH('Desktop.RemoteAssistSessions', 'ConsentRequestedAtUtc') IS NOT NULL
                ALTER TABLE [Desktop].[RemoteAssistSessions] DROP COLUMN [ConsentRequestedAtUtc];
            IF COL_LENGTH('Desktop.RemoteAssistSessions', 'SessionUsername') IS NOT NULL
                ALTER TABLE [Desktop].[RemoteAssistSessions] DROP COLUMN [SessionUsername];
            """);
    }
}
