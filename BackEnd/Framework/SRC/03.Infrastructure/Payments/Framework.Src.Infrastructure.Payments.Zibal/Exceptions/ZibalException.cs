namespace Framework.Src.Infrastructure.Payments.Zibal.Exceptions;



/// <summary>

/// خطای سطح کتابخانه زیبال (IPG REST).

/// </summary>

public sealed class ZibalException : Exception

{

    /// <summary>

    /// کد نتیجه بازگشتی از API زیبال (در صورت وجود).

    /// </summary>

    public int? ResultCode { get; }



    /// <summary>

    /// ایجاد خطای زیبال.

    /// </summary>

    public ZibalException(string message, int? resultCode = null, Exception? inner = null)

        : base(message, inner)

    {

        ResultCode = resultCode;

    }

}


