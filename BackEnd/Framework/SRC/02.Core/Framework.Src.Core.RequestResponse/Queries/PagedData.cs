namespace Framework.Src.Core.RequestResponse.Queries
{
    /// <summary>
    /// Represents the base structure for returning paginated data when querying.
    /// This class encapsulates the results of a query, including pagination information.
    /// </summary>
    /// <typeparam name="T">Specifies the type of data returned from the query.</typeparam>
    public class PagedData<T>
    {
        /// <summary>
        /// Gets or sets the list of query results.
        /// </summary>
        public List<T>? QueryResult { get; set; }


        /// <summary>
        /// Gets or sets the current page number.
        /// </summary>
        public int PageNumber { get; set; } = 1;


        /// <summary>
        /// Gets or sets the size of each page, which determines how many results are returned per page.
        /// </summary>
        public int PageSize { get; set; } = 10;


        /// <summary>
        /// Gets or sets the total number of items available across all pages.
        /// </summary>
        public int TotalCount { get; set; }
    }
}
