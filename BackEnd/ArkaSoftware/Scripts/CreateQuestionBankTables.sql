-- Question bank + ExamQuestions.BankQuestionId link.
-- Safe to re-run.

IF OBJECT_ID(N'Exam.BankQuestions', N'U') IS NULL
BEGIN
    CREATE TABLE Exam.BankQuestions (
        Id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        BusinessId UNIQUEIDENTIFIER NOT NULL,
        QuestionType TINYINT NOT NULL,
        Prompt NVARCHAR(4000) NOT NULL,
        CodeSnippet NVARCHAR(MAX) NULL,
        CodeLanguage NVARCHAR(50) NULL,
        DefaultPoints DECIMAL(18,4) NOT NULL,
        Category NVARCHAR(200) NULL,
        Topic NVARCHAR(200) NULL,
        Tags NVARCHAR(500) NULL,
        CourseId BIGINT NULL,
        OwnerUserId BIGINT NOT NULL,
        OwnerTeacherId BIGINT NULL,
        ContentHash CHAR(64) NOT NULL,
        ManualDifficulty TINYINT NULL,
        ComputedDifficulty TINYINT NOT NULL CONSTRAINT DF_BankQ_ComputedDifficulty DEFAULT 0,
        TotalGradedAnswers INT NOT NULL CONSTRAINT DF_BankQ_TotalGraded DEFAULT 0,
        CorrectAnswers INT NOT NULL CONSTRAINT DF_BankQ_Correct DEFAULT 0,
        CorrectRate DECIMAL(18,4) NOT NULL CONSTRAINT DF_BankQ_CorrectRate DEFAULT 0,
        UsageCount INT NOT NULL CONSTRAINT DF_BankQ_Usage DEFAULT 0,
        IsActive BIT NOT NULL CONSTRAINT DF_BankQ_IsActive DEFAULT 1,
        IsDelete BIT NOT NULL CONSTRAINT DF_BankQ_IsDelete DEFAULT 0,
        CreatedByUserId NVARCHAR(50) NULL,
        CreatedDateTime DATETIME2 NULL,
        ModifiedByUserId NVARCHAR(50) NULL,
        ModifiedDateTime DATETIME2 NULL
    );

    CREATE INDEX IX_BankQuestions_ContentHash ON Exam.BankQuestions(ContentHash) WHERE IsDelete = 0 AND IsActive = 1;
    CREATE INDEX IX_BankQuestions_OwnerUserId ON Exam.BankQuestions(OwnerUserId);
    CREATE INDEX IX_BankQuestions_Difficulty ON Exam.BankQuestions(ComputedDifficulty, ManualDifficulty);
    CREATE INDEX IX_BankQuestions_Category ON Exam.BankQuestions(Category);
END
GO

IF OBJECT_ID(N'Exam.BankQuestionOptions', N'U') IS NULL
BEGIN
    CREATE TABLE Exam.BankQuestionOptions (
        Id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        BusinessId UNIQUEIDENTIFIER NOT NULL,
        BankQuestionId BIGINT NOT NULL,
        Text NVARCHAR(1000) NOT NULL,
        IsCorrect BIT NOT NULL,
        OrderIndex INT NOT NULL,
        IsDelete BIT NOT NULL CONSTRAINT DF_BankQOpt_IsDelete DEFAULT 0,
        CreatedByUserId NVARCHAR(50) NULL,
        CreatedDateTime DATETIME2 NULL,
        ModifiedByUserId NVARCHAR(50) NULL,
        ModifiedDateTime DATETIME2 NULL,
        CONSTRAINT FK_BankQuestionOptions_BankQuestions
            FOREIGN KEY (BankQuestionId) REFERENCES Exam.BankQuestions(Id) ON DELETE CASCADE
    );
END
GO

IF COL_LENGTH(N'Exam.ExamQuestions', N'BankQuestionId') IS NULL
BEGIN
    ALTER TABLE Exam.ExamQuestions ADD BankQuestionId BIGINT NULL;
    CREATE INDEX IX_ExamQuestions_BankQuestionId ON Exam.ExamQuestions(BankQuestionId);
END
GO
