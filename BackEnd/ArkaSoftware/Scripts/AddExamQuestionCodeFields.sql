-- Add optional code snippet fields to exam questions.
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'Exam.ExamQuestions') AND name = N'CodeSnippet'
)
BEGIN
    ALTER TABLE Exam.ExamQuestions ADD CodeSnippet NVARCHAR(MAX) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'Exam.ExamQuestions') AND name = N'CodeLanguage'
)
BEGIN
    ALTER TABLE Exam.ExamQuestions ADD CodeLanguage NVARCHAR(50) NULL;
END
GO
