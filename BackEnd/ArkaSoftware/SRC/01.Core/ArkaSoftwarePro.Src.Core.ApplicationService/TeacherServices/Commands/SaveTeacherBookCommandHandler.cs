using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;

using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;

using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Commands;

using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;

using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;

using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;

using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;

using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.SaveTeacherBook;

using Framework.Src.Core.ApplicationService.Commands;

using Framework.Src.Core.RequestResponse.Commands;

using Framework.Src.Core.RequestResponse.Common;

using Framework.Src.Utilities.OutService.Services;

using Microsoft.AspNetCore.Http;

using System.Linq;

using System.Security.Claims;



namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Commands;



public class SaveTeacherBookCommandHandler(

    ArkaSoftwareCMPOutServices outer,

    ITeacherCommandRepository teacherCommandRepository,

    IUserCommandRepository userCommandRepository,

    IStudentCommandRepository studentCommandRepository,

    TeacherAdvertisingEntitlements entitlements,

    TeacherXpService xpService,

    IHttpContextAccessor httpContextAccessor,

    TeacherContentNotifier contentNotifier)

    : CommandHandler<SaveTeacherBookCommand, long>(outer)

{

    public override async Task<CommandResult<long>> Handle(SaveTeacherBookCommand command)

    {

        if (!TeacherContentTargetResolver.TryGetAuthenticatedUserId(httpContextAccessor, out _))
            return await ResultAsync(default(long), ApplicationServiceStatus.NotFound);

        var isAdmin = DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User);

        var teacher = await TeacherContentTargetResolver.ResolveTeacherForContentEditAsync(
            command.TeacherUserId,
            httpContextAccessor,
            userCommandRepository,
            teacherCommandRepository,
            studentCommandRepository,
            command.TeacherId);

        // Admin editing a book from the global list often omits teacherUserId (or the book
        // belongs to another teacher). Resolve the owner by book id — same as DeleteTeacherBook.
        if (command.BookId > 0 && isAdmin)
        {
            var ownsBook = teacher?.Books.Any(b => b.Id == command.BookId) == true;
            if (!ownsBook)
                teacher = await teacherCommandRepository.GetByBookIdAsync(command.BookId);
        }

        if (teacher == null)
            return await ResultAsync(default(long), ApplicationServiceStatus.NotFound);

        var blockedReason = isAdmin ? null : TeacherAccountGuard.GetContentManagementBlockReason(teacher);

        if (blockedReason != null)

        {

            result.AddMessage(blockedReason);

            return await ResultAsync(default(long), ApplicationServiceStatus.ValidationError);

        }



        if (string.IsNullOrWhiteSpace(command.Title))

        {

            result.AddMessage("Title is required.");

            return await ResultAsync(default(long), ApplicationServiceStatus.ValidationError);

        }



        if (!string.IsNullOrWhiteSpace(command.Isbn) && command.Isbn.Trim().Length > 50)

        {

            result.AddMessage("ISBN must be 50 characters or fewer.");

            return await ResultAsync(default(long), ApplicationServiceStatus.ValidationError);

        }



        var settings = await teacherCommandRepository.GetOrCreateMonetizationSettingsAsync();

        var hasPaid = await entitlements.HasPaidFeaturesAsync(teacher);

        if (!isAdmin && !hasPaid && command.BookId <= 0)

        {

            var bookCount = teacher.Books.Count();

            if (bookCount >= settings.FreeMaxBooks)

            {

                result.AddMessage($"Free plan allows up to {settings.FreeMaxBooks} book(s).");

                return await ResultAsync(default(long), ApplicationServiceStatus.ValidationError);

            }

        }



        var status = isAdmin ? TeacherApprovalStatus.Approved : TeacherApprovalStatus.Pending;

        var formatFiles = BuildFormatFiles(command);

        var tags = command.Tags ?? [];

        long bookId;



        if (command.BookId > 0)

        {

            var existing = teacher.Books.FirstOrDefault(b => b.Id == command.BookId);

            if (existing == null)

                return await ResultAsync(default(long), ApplicationServiceStatus.NotFound);



            teacher.UpdateBook(

                command.BookId,

                command.Title,

                command.ShortDescription ?? string.Empty,

                command.LongDescriptionHtml ?? string.Empty,

                command.CoverImageUrl,

                formatFiles,

                command.Publisher,

                command.PublicationYear,

                command.Isbn,

                tags,

                command.SortOrder,

                status,

                command.CategoryId);

            existing.EnsureSlug(existing.Id);

            existing.UpdateSeo(command.SeoTitle, command.MetaDescription, command.OgImageUrl);

            bookId = existing.Id;

        }

        else

        {

            var created = teacher.AddBook(

                command.Title,

                command.ShortDescription ?? string.Empty,

                command.LongDescriptionHtml ?? string.Empty,

                command.CoverImageUrl,

                formatFiles,

                command.Publisher,

                command.PublicationYear,

                command.Isbn,

                tags,

                command.SortOrder,

                status,

                command.CategoryId);

            await teacherCommandRepository.CommitAsync();

            created.EnsureSlug(created.Id);

            created.UpdateSeo(command.SeoTitle, command.MetaDescription, command.OgImageUrl);

            bookId = created.Id;

        }



        await teacherCommandRepository.CommitAsync();

        if (isAdmin)

        {

            var savedBook = teacher.Books.FirstOrDefault(b => b.Id == bookId);

            if (savedBook != null)

            {

                savedBook.SetApprovedSnapshot(TeacherReviewSnapshotService.BuildBookSnapshot(savedBook));

                await teacherCommandRepository.CommitAsync();

            }

        }

        if (command.BookId <= 0)

        {

            await xpService.TryAwardOnceAsync(

                teacher,

                settings.XpRewardSaveBook,

                TeacherXpEventReason.SaveBook,

                bookId);

        }

        if (!isAdmin)

        {

            var teacherWithDetails = await teacherCommandRepository.GetByIdWithDetailsAsync(teacher.Id);

            var savedBook = teacherWithDetails?.Books.FirstOrDefault(b => b.Id == bookId)

                ?? teacher.Books.FirstOrDefault(b => b.Id == bookId);

            var displayName = teacherWithDetails?.User?.UserFullName != null

                ? $"{teacherWithDetails.User.UserFullName.FirstName} {teacherWithDetails.User.UserFullName.LastName}".Trim()

                : "Teacher";

            await contentNotifier.NotifyAdminsContentSubmittedAsync(

                teacher.Id,

                displayName,

                "book",

                savedBook?.Title ?? command.Title);

        }

        return await OkAsync(bookId);

    }



    private static TeacherBookFormatFiles BuildFormatFiles(SaveTeacherBookCommand command)

    {

        if (HasExplicitFormatFields(command))

        {

            return new TeacherBookFormatFiles

            {

                PdfFileUrl = command.PdfFileUrl,

                PdfFileName = command.PdfFileName,

                EpubFileUrl = command.EpubFileUrl,

                EpubFileName = command.EpubFileName,

                WordFileUrl = command.WordFileUrl,

                WordFileName = command.WordFileName,

            };

        }



        return TeacherBookFormatFiles.FromLegacy(command.BookFileUrl, command.BookFileName);

    }



    private static bool HasExplicitFormatFields(SaveTeacherBookCommand command) =>

        command.PdfFileUrl != null

        || command.EpubFileUrl != null

        || command.WordFileUrl != null;



    private bool TryGetUserId(out long userId)

    {

        userId = 0;

        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>

            x.Type == ClaimTypes.NameIdentifier || x.Type == "userId" || x.Type == "nameid");

        return claim != null && long.TryParse(claim.Value, out userId) && userId > 0;

    }

}
