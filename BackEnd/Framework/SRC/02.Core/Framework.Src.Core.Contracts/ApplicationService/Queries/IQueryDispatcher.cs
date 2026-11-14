using Framework.Src.Core.RequestResponse.Queries;

namespace Framework.Src.Core.Contracts.ApplicationService.Queries
{

    /// <summary>
    ///جهت اتصال ساده کوئری‌ها به هندلر‌ها  Mediator تعریف ساختار الگوی
    /// </summary>
    public interface IQueryDispatcher
    {
        Task<QueryResult<TData>> Execute<TQuery, TData>(TQuery query) where TQuery : class, IQuery<TData>;
    }
}
