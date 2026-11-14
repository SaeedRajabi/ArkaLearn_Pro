using Framework.Src.Core.RequestResponse.Common;

namespace Framework.Src.Core.RequestResponse.Commands
{
    /// <summary>
    /// نتیجه انجام هر عملیات به کمک این کلاس بازگشت داده می‌شود.
    /// </summary>
    public class CommandResult : ApplicationServiceResult
    {


    }



    /// <summary>
    /// نتیجه انجام هر عملیات به کمک این کلاس بازگشت داده می‌شود.
    /// این ساختار در صورتی استفاده میشود که برای عملیات مقدار خروجی نیاز باشد
    /// </summary>
    /// <typeparam name="TData">نوع داده‌ای که بازگشت داده می‌شود</typeparam>
    public class CommandResult<TData> : CommandResult
    {
        public TData? _data;
        public TData? Data => _data;

    }
}
