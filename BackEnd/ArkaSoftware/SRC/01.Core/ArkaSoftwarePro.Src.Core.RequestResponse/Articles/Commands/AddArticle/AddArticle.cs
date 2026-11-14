using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Commands.AddArticle
{
    [InvalidatesCache(CacheRegion.Articles)]
    public class AddArticle : ICommand<string>, IWebRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public IFormFile? ThumbnailUrl { get; set; }
        /// <summary>Existing media library path (e.g. /media/123/file.jpg) when no file is uploaded.</summary>
        public string? LibraryThumbnailUrl { get; set; }
        public long? CategoryId { get; set; }
        public bool IsPublished { get; set; }
        public string? SeoTitle { get; set; }
        public string? MetaDescription { get; set; }
        public string? OgImageUrl { get; set; }
        public string? TagsJson { get; set; }
        public string Path => "/api/Service/Article/Add";
    }
}
