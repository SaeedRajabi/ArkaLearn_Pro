namespace Framework.Src.Infrastructure.Payments.ZarinPal.Exceptions;

/// <summary>
/// خطای سطح کتابخانه زرین‌پال (REST یا GraphQL).
/// </summary>
public sealed class ZarinPalException : Exception
{
    /// <summary>
    /// کد خطای بازگشتی از API (در صورت وجود).
    /// </summary>
    public int? ErrorCode { get; }

    /// <summary>
    /// ایجاد خطای زرین‌پال.
    /// </summary>
    public ZarinPalException(string message, int? errorCode = null, Exception? inner = null)
        : base(message, inner)
    {
        ErrorCode = errorCode;
    }
}
