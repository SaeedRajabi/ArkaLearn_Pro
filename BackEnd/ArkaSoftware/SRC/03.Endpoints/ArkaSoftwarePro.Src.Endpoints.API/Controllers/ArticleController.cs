using ArkaSoftwarePro.Src.Core.ApplicationService.FileStorage;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Commands.AddArticle;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Commands.AddArticleComment;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Commands.ApproveArticleComment;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Commands.DeleteArticleComment;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Commands.DeleteArticle;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Commands.UpdateArticle;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Commands.Favorites;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.GetAllCommentsByArticleId;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.GetArticleById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.GetArticleBySlug;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.SearchArticles;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.GetMyFavoriteArticleIds;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.GetMyFavoriteArticles;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.GetMyArticles;
using ArkaSoftwarePro.Src.Core.Domain.ArticleAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers
{
    [Route("api/Service/[controller]")]
    public class ArticleController : BaseController
    {
        private readonly FileStoragePathSaver _pathSaver;
        private readonly ArkaSoftwareCommandDbContext _commandDbContext;

        public ArticleController(FileStoragePathSaver pathSaver, ArkaSoftwareCommandDbContext commandDbContext)
        {
            _pathSaver = pathSaver;
            _commandDbContext = commandDbContext;
        }

        

        [HttpPost("Add")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> Add([FromForm] AddArticle command)
        {
            return await Create<AddArticle, string>(command);
        }

        [HttpPost("add-comment")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> AddComment([FromBody] AddArticleComment command)
        {
            return await Create<AddArticleComment, string>(command);
        }

        [HttpPut("approve-comment")]
        [HttpPost("approve-comment")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> ApproveComment([FromBody] ApproveArticleCommentCommand command)
        {
            return await Edit<ApproveArticleCommentCommand, string>(command);
        }

        [HttpDelete("delete-comment")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> DeleteComment([FromQuery] DeleteArticleCommentCommand command)
        {
            return await Edit<DeleteArticleCommentCommand, string>(command);
        }

        [HttpGet("GetById")]
        public async Task<IActionResult> GetById([FromQuery] GetArticleByIdQuery query)
            => await Query<GetArticleByIdQuery, ArticleQri>(query);

        [HttpGet("GetBySlug")]
        public async Task<IActionResult> GetBySlug([FromQuery] GetArticleBySlugQuery query)
            => await Query<GetArticleBySlugQuery, ArticleQri>(query);

        [HttpGet("Search")]
        public async Task<IActionResult> Search([FromQuery] SearchArticleByInputValueQuery query)
            => await Query<SearchArticleByInputValueQuery, PagedData<SearchArticleQri>>(query);

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpGet("GetMyArticles")]
        public Task<IActionResult> GetMyArticles([FromQuery] GetMyArticlesQuery query)
            => Query<GetMyArticlesQuery, PagedData<SearchArticleQri>>(query);

        [HttpGet("get-comments")]
        public async Task<IActionResult> GetComments([FromQuery] GetAllCommentsByArticleIdQuery query)
            => await Query<GetAllCommentsByArticleIdQuery, PagedData<GetAllCommentsByArticleIdQri>>(query);

        [HttpGet("reaction-summary")]
        public async Task<IActionResult> GetReactionSummary([FromQuery] long articleId)
        {
            if (articleId <= 0)
                return BadRequest("ArticleId is required.");

            await EnsureArticleReactionsTableAsync();

            var userId = TryResolveCurrentUserId();
            var likes = await _commandDbContext.ArticleReactions.CountAsync(x => x.ArticleId == articleId && x.Reaction == 1);
            var dislikes = await _commandDbContext.ArticleReactions.CountAsync(x => x.ArticleId == articleId && x.Reaction == -1);
            var myReaction = userId.HasValue
                ? await _commandDbContext.ArticleReactions
                    .Where(x => x.ArticleId == articleId && x.UserId == userId.Value)
                    .Select(x => x.Reaction)
                    .FirstOrDefaultAsync()
                : 0;

            return Ok(new ArticleReactionSummary(likes, dislikes, myReaction));
        }

        [HttpPost("react")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> React([FromBody] SetArticleReactionRequest request)
        {
            if (request.ArticleId <= 0)
                return BadRequest("ArticleId is required.");

            if (request.Reaction is not (-1 or 0 or 1))
                return BadRequest("Reaction must be -1, 0, or 1.");

            var userId = TryResolveCurrentUserId();
            if (!userId.HasValue)
                return Unauthorized();

            var articleExists = await _commandDbContext.Articles.AnyAsync(x => x.Id == request.ArticleId);
            if (!articleExists)
                return NotFound("Article not found.");

            await EnsureArticleReactionsTableAsync();

            var existing = await _commandDbContext.ArticleReactions
                .FirstOrDefaultAsync(x => x.ArticleId == request.ArticleId && x.UserId == userId.Value);

            if (request.Reaction == 0)
            {
                if (existing != null)
                    _commandDbContext.ArticleReactions.Remove(existing);
            }
            else if (existing == null)
            {
                await _commandDbContext.ArticleReactions.AddAsync(new ArticleReaction(request.ArticleId, userId.Value, request.Reaction));
            }
            else
            {
                existing.SetReaction(request.Reaction);
            }

            await _commandDbContext.SaveChangesAsync();

            var likes = await _commandDbContext.ArticleReactions.CountAsync(x => x.ArticleId == request.ArticleId && x.Reaction == 1);
            var dislikes = await _commandDbContext.ArticleReactions.CountAsync(x => x.ArticleId == request.ArticleId && x.Reaction == -1);

            return Ok(new ArticleReactionSummary(likes, dislikes, request.Reaction));
        }

        [HttpPut("Update")]
        [HttpPost("Update")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> Update([FromBody] UpdateArticle command)
            => await Edit<UpdateArticle, string>(command);

        [HttpDelete("Delete")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> Delete([FromQuery] long id)
        {
            return await Edit<DeleteArticle, string>(new DeleteArticle { Id = id });
        }

        [HttpPost("AddToFavorites")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> AddToFavorites([FromBody] AddArticleToFavoritesCommand command)
            => await Create<AddArticleToFavoritesCommand, string>(command);

        [HttpPost("RemoveFromFavorites")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> RemoveFromFavorites([FromBody] RemoveArticleFromFavoritesCommand command)
            => await Create<RemoveArticleFromFavoritesCommand, string>(command);

        [HttpGet("GetMyFavoriteArticleIds")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetMyFavoriteArticleIds()
            => await Query<GetMyFavoriteArticleIdsQuery, List<long>>(new GetMyFavoriteArticleIdsQuery());

        [HttpGet("GetMyFavoriteArticles")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetMyFavoriteArticles()
            => await Query<GetMyFavoriteArticlesQuery, List<GetMyFavoriteArticleQri>>(new GetMyFavoriteArticlesQuery());

        [HttpPost("UploadThumbnail")]
        [ApiExplorerSettings(IgnoreApi = true)]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> UploadThumbnail(IFormFile file)
        {
            var url = await SaveArticleUploadAsync(file);
            return url == null ? BadRequest("File is required.") : Ok(new { url });
        }

        private async Task<string?> SaveArticleUploadAsync(IFormFile? file)
        {
            if (file == null || file.Length == 0)
                return null;
            return await _pathSaver.SavePublicAsync(file, "images/articles");
        }

        private long? TryResolveCurrentUserId()
        {
            var claim = User?.Claims?.FirstOrDefault(x =>
                x.Type == ClaimTypes.NameIdentifier ||
                x.Type == "userId" ||
                x.Type == "nameid");

            return long.TryParse(claim?.Value, out var userId) ? userId : null;
        }

        private async Task EnsureArticleReactionsTableAsync()
        {
            await _commandDbContext.Database.ExecuteSqlRawAsync("""
                IF SCHEMA_ID(N'Article') IS NULL
                    EXEC(N'CREATE SCHEMA [Article]');

                IF OBJECT_ID(N'[Article].[ArticleReactions]', N'U') IS NULL
                BEGIN
                    CREATE TABLE [Article].[ArticleReactions](
                        [Id] BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_ArticleReactions] PRIMARY KEY,
                        [ArticleId] BIGINT NOT NULL,
                        [UserId] BIGINT NOT NULL,
                        [Reaction] INT NOT NULL,
                        [CreatedDateTime] DATETIME2 NOT NULL,
                        [ModifiedDateTime] DATETIME2 NULL
                    );
                END;

                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.indexes
                    WHERE name = N'IX_ArticleReactions_ArticleId_UserId'
                      AND object_id = OBJECT_ID(N'[Article].[ArticleReactions]')
                )
                BEGIN
                    CREATE UNIQUE INDEX [IX_ArticleReactions_ArticleId_UserId]
                    ON [Article].[ArticleReactions]([ArticleId], [UserId]);
                END;
                """);
        }
    }

    public sealed record SetArticleReactionRequest(long ArticleId, int Reaction);
    public sealed record ArticleReactionSummary(int Likes, int Dislikes, int MyReaction);
}
