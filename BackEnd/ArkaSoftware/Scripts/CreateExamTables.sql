-- Run once before deploying the Exam System API update.
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'Exam')
    EXEC('CREATE SCHEMA Exam');
GO

IF OBJECT_ID(N'Exam.Exams', N'U') IS NULL
BEGIN
    CREATE TABLE Exam.Exams (
        Id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        BusinessId UNIQUEIDENTIFIER NOT NULL,
        Title NVARCHAR(300) NOT NULL,
        Description NVARCHAR(4000) NULL,
        CourseId BIGINT NOT NULL,
        TeacherId BIGINT NOT NULL,
        Level NVARCHAR(50) NOT NULL,
        EndsAtUtc DATETIME2 NOT NULL,
        DurationMinutes INT NOT NULL,
        Status TINYINT NOT NULL,
        TotalPoints DECIMAL(18,4) NOT NULL,
        IsDelete BIT NOT NULL DEFAULT 0,
        CreatedByUserId NVARCHAR(50) NULL,
        CreatedDateTime DATETIME2 NULL,
        ModifiedByUserId NVARCHAR(50) NULL,
        ModifiedDateTime DATETIME2 NULL
    );
    CREATE INDEX IX_Exams_TeacherId ON Exam.Exams(TeacherId);
    CREATE INDEX IX_Exams_CourseId ON Exam.Exams(CourseId);
END
GO

IF OBJECT_ID(N'Exam.ExamQuestions', N'U') IS NULL
BEGIN
    CREATE TABLE Exam.ExamQuestions (
        Id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        BusinessId UNIQUEIDENTIFIER NOT NULL,
        ExamId BIGINT NOT NULL,
        OrderIndex INT NOT NULL,
        QuestionType TINYINT NOT NULL,
        Prompt NVARCHAR(4000) NOT NULL,
        CodeSnippet NVARCHAR(MAX) NULL,
        CodeLanguage NVARCHAR(50) NULL,
        Points DECIMAL(18,4) NOT NULL,
        IsDelete BIT NOT NULL DEFAULT 0,
        CreatedByUserId NVARCHAR(50) NULL,
        CreatedDateTime DATETIME2 NULL,
        ModifiedByUserId NVARCHAR(50) NULL,
        ModifiedDateTime DATETIME2 NULL,
        CONSTRAINT FK_ExamQuestions_Exams FOREIGN KEY (ExamId) REFERENCES Exam.Exams(Id) ON DELETE CASCADE
    );
END
GO

IF OBJECT_ID(N'Exam.ExamQuestionOptions', N'U') IS NULL
BEGIN
    CREATE TABLE Exam.ExamQuestionOptions (
        Id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        BusinessId UNIQUEIDENTIFIER NOT NULL,
        ExamQuestionId BIGINT NOT NULL,
        Text NVARCHAR(1000) NOT NULL,
        IsCorrect BIT NOT NULL,
        OrderIndex INT NOT NULL,
        IsDelete BIT NOT NULL DEFAULT 0,
        CreatedByUserId NVARCHAR(50) NULL,
        CreatedDateTime DATETIME2 NULL,
        ModifiedByUserId NVARCHAR(50) NULL,
        ModifiedDateTime DATETIME2 NULL,
        CONSTRAINT FK_ExamQuestionOptions_Questions FOREIGN KEY (ExamQuestionId) REFERENCES Exam.ExamQuestions(Id) ON DELETE CASCADE
    );
END
GO

IF OBJECT_ID(N'Exam.ExamAssignments', N'U') IS NULL
BEGIN
    CREATE TABLE Exam.ExamAssignments (
        Id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        BusinessId UNIQUEIDENTIFIER NOT NULL,
        ExamId BIGINT NOT NULL,
        StudentId BIGINT NOT NULL,
        UserId BIGINT NOT NULL,
        AssignedAtUtc DATETIME2 NOT NULL,
        IsDelete BIT NOT NULL DEFAULT 0,
        CreatedByUserId NVARCHAR(50) NULL,
        CreatedDateTime DATETIME2 NULL,
        ModifiedByUserId NVARCHAR(50) NULL,
        ModifiedDateTime DATETIME2 NULL,
        CONSTRAINT FK_ExamAssignments_Exams FOREIGN KEY (ExamId) REFERENCES Exam.Exams(Id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX UX_ExamAssignments_ExamStudent ON Exam.ExamAssignments(ExamId, StudentId);
END
GO

IF OBJECT_ID(N'Exam.ExamAttempts', N'U') IS NULL
BEGIN
    CREATE TABLE Exam.ExamAttempts (
        Id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        BusinessId UNIQUEIDENTIFIER NOT NULL,
        ExamId BIGINT NOT NULL,
        StudentId BIGINT NOT NULL,
        UserId BIGINT NOT NULL,
        Status TINYINT NOT NULL,
        StartedAtUtc DATETIME2 NULL,
        ExpiresAtUtc DATETIME2 NULL,
        SubmittedAtUtc DATETIME2 NULL,
        AutoScore DECIMAL(18,4) NULL,
        FinalScore DECIMAL(18,4) NULL,
        ProfessorFeedback NVARCHAR(4000) NULL,
        GradedAtUtc DATETIME2 NULL,
        IsDelete BIT NOT NULL DEFAULT 0,
        CreatedByUserId NVARCHAR(50) NULL,
        CreatedDateTime DATETIME2 NULL,
        ModifiedByUserId NVARCHAR(50) NULL,
        ModifiedDateTime DATETIME2 NULL
    );
    CREATE UNIQUE INDEX UX_ExamAttempts_ExamStudent ON Exam.ExamAttempts(ExamId, StudentId);
    CREATE INDEX IX_ExamAttempts_ExamId ON Exam.ExamAttempts(ExamId);
END
GO

IF OBJECT_ID(N'Exam.ExamAnswers', N'U') IS NULL
BEGIN
    CREATE TABLE Exam.ExamAnswers (
        Id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        BusinessId UNIQUEIDENTIFIER NOT NULL,
        ExamAttemptId BIGINT NOT NULL,
        ExamQuestionId BIGINT NOT NULL,
        SelectedOptionIdsJson NVARCHAR(500) NULL,
        TextAnswer NVARCHAR(MAX) NULL,
        PointsAwarded DECIMAL(18,4) NULL,
        IsAutoGraded BIT NULL,
        IsDelete BIT NOT NULL DEFAULT 0,
        CreatedByUserId NVARCHAR(50) NULL,
        CreatedDateTime DATETIME2 NULL,
        ModifiedByUserId NVARCHAR(50) NULL,
        ModifiedDateTime DATETIME2 NULL,
        CONSTRAINT FK_ExamAnswers_Attempts FOREIGN KEY (ExamAttemptId) REFERENCES Exam.ExamAttempts(Id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX UX_ExamAnswers_AttemptQuestion ON Exam.ExamAnswers(ExamAttemptId, ExamQuestionId);
END
GO
