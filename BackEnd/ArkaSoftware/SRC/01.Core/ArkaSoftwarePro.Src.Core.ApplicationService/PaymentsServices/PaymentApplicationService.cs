using ArkaSoftwarePro.Src.Core.Contracts.Finance;
using ArkaSoftwarePro.Src.Core.Domain.FinanceAggregate.Entities;
using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.ApplicationService.InvoicesServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.WalletServices;
using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.Contracts.EducationPlans.EducationPlanRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.EducationPlans.EducationPlanRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.SupportSubscription;
using ArkaSoftwarePro.Src.Core.Contracts.Invoices.InvoiceRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Orders.OrderRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Seminars.SeminarRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.SupportSubscriptionAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Commands.PayEducationPlanInstallment;
using ArkaSoftwarePro.Src.Core.RequestResponse.Invoices.Commands.AddTransaction;
using ArkaSoftwarePro.Src.Core.RequestResponse.Invoices.Queries.GetInvoiceById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Invoices.Queries.GetMyInvoices;
using ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Queries.GetOrderById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Commands.RegisterUserForSeminar;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetMyRegisteredSeminars;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetSeminarById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById;
using ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.PaymentsServices;
using ArkaSoftwarePro.Src.Core.Contracts.Finance.Payments;
using Framework.Src.Core.RequestResponse.Common;
using ArkaSoftwarePro.Src.Core.RequestResponse.Payments;
using ArkaSoftwarePro.Src.Core.Contracts.Users.Services;
using Framework.Src.Core.Contracts.ApplicationService.Commands;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.PaymentsServices;

public sealed class PaymentApplicationService(
        TrackedPaymentService trackedPayments,
        ILogger<PaymentApplicationService> logger,
        IPaymentGatewaySettingsProvider gatewaySettingsProvider,
        IClientPaymentGatewayFactory gatewayFactory,
        IInvoiceQueryRepository invoiceQueryRepository,
        IOrderQueryRepository orderQueryRepository,
        ISeminarQueriesRepository seminarQueriesRepository,
        IUserQueryRepository userQueryRepository,
        ITeacherCommandRepository teacherCommandRepository,
        IEducationPlanCommandRepository educationPlanCommandRepository,
        IEducationPlanQueryRepository educationPlanQueryRepository,
        TeacherAdvertisingEntitlements advertisingEntitlements,
        AdvertisementBumpService advertisementBumpService,
        IStudentSupportSubscriptionRepository studentSupportSubscriptionRepository,
        UserWalletService userWalletService,
        ITransactionalEmailNotifier transactionalEmailNotifier,
        CoursePurchaseFulfillmentService coursePurchaseFulfillmentService,
        TeacherFinanceService teacherFinanceService,
        ArkaSoftwarePro.Src.Core.Contracts.Enrollments.EnrollmentRepositoryContracts.Commands.IEnrollmentCommandRepository enrollmentCommandRepository,
        ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Queries.IStudentQueryRepository studentQueryRepository,
        ICurrentActor actor,
        ICommandDispatcher commandDispatcher)
{
private readonly IPaymentGatewaySettingsProvider _gatewaySettingsProvider = gatewaySettingsProvider;
private readonly IClientPaymentGatewayFactory _gatewayFactory = gatewayFactory;
private PaymentGatewayRuntimeOptions? _runtimeOptions;
private IClientPaymentGateway? _runtimeGateway;
private string? _gatewayError;
private readonly IStudentSupportSubscriptionRepository _studentSupportSubscriptionRepository = studentSupportSubscriptionRepository;
private readonly IInvoiceQueryRepository _invoiceQueryRepository = invoiceQueryRepository;
private readonly IOrderQueryRepository _orderQueryRepository = orderQueryRepository;
private readonly ISeminarQueriesRepository _seminarQueriesRepository = seminarQueriesRepository;
private readonly IUserQueryRepository _userQueryRepository = userQueryRepository;
private readonly ITeacherCommandRepository _teacherCommandRepository = teacherCommandRepository;
private readonly IEducationPlanCommandRepository _educationPlanCommandRepository = educationPlanCommandRepository;
private readonly IEducationPlanQueryRepository _educationPlanQueryRepository = educationPlanQueryRepository;
private readonly TeacherAdvertisingEntitlements _advertisingEntitlements = advertisingEntitlements;
private readonly AdvertisementBumpService _advertisementBumpService = advertisementBumpService;
private readonly UserWalletService _userWalletService = userWalletService;
private readonly ITransactionalEmailNotifier _transactionalEmailNotifier = transactionalEmailNotifier;
private readonly CoursePurchaseFulfillmentService _coursePurchaseFulfillmentService = coursePurchaseFulfillmentService;
private readonly TeacherFinanceService _teacherFinanceService = teacherFinanceService;
private readonly ArkaSoftwarePro.Src.Core.Contracts.Enrollments.EnrollmentRepositoryContracts.Commands.IEnrollmentCommandRepository _enrollmentCommandRepository = enrollmentCommandRepository;
private readonly ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Queries.IStudentQueryRepository _studentQueryRepository = studentQueryRepository;

public async Task<PaymentOperationResult> RequestWalletTopUp(WalletTopUpRequest request, CancellationToken cancellationToken)
{
    if (!TryGetCurrentUserId(out var userId))
        return Unauthorized();

    if (request.AmountToman <= 0)
        return BadRequest(new { message = "Top-up amount must be greater than zero." });

    var currentUser = await _userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = userId });
    if (currentUser == null || string.IsNullOrWhiteSpace(currentUser.PhoneNumber))
        return BadRequest(new { message = "Please add and verify your mobile number in your profile before topping up the wallet." });

    if (!await EnsureGatewayAsync(cancellationToken))
        return Unavailable(new { message = _gatewayError });

    var orderId = BuildOrderId(PaymentTargetType.WalletTopUp, request.AmountToman, userId);
    var paymentRequest = new PaymentStartRequest(
        orderId,
        ToGatewayAmount(request.AmountToman),
        BuildCallbackUrl(orderId),
        "Wallet top-up",
        currentUser?.FullName,
        currentUser?.Email,
        currentUser?.PhoneNumber);

    try
    {
        var result = await CreateTrackedPaymentAsync(paymentRequest, cancellationToken);
        return Ok(new PaymentStartResponse(result.PaymentUrl, _runtimeOptions!.Provider, orderId));
    }
    catch (Exception ex)
    {
        return GatewayFailure(new { message = ex.Message });
    }
}

public async Task<PaymentOperationResult> RequestInvoicePayment(InvoicePaymentRequest request, CancellationToken cancellationToken)
{
    if (!TryGetCurrentUserId(out var userId))
        return Unauthorized();

    var myInvoices = await _invoiceQueryRepository.GetMyInvoicesAsync(new GetMyInvoicesQuery { UserId = userId })
        ?? new List<GetMyInvoicesQri>();
    var invoice = myInvoices
        .FirstOrDefault(x => x.Id == request.InvoiceId);

    if (invoice == null)
        return NotFound(new { message = "Invoice not found." });

    var normalizedStatus = NormalizeStatus(invoice.Status);
    if (normalizedStatus == "PAID")
        return BadRequest(new { message = "This invoice has already been paid." });

    if (normalizedStatus is "CANCELED" or "CANCELLED")
        return BadRequest(new { message = "This invoice is cancelled." });

    if (invoice.RemainingAmount <= 0)
        return BadRequest(new { message = "There is no remaining amount to pay for this invoice." });

    if (!await EnsureGatewayAsync(cancellationToken))
        return Unavailable(new { message = _gatewayError });

    var currentUser = await _userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = userId });
    var orderId = BuildOrderId(PaymentTargetType.Invoice, request.InvoiceId, userId);
    var paymentRequest = new PaymentStartRequest(
        orderId,
        ToGatewayAmount(invoice.RemainingAmount),
        BuildCallbackUrl(orderId),
        $"Invoice {invoice.InvoiceNumber}",
        currentUser?.FullName,
        currentUser?.Email,
        currentUser?.PhoneNumber);

    try
    {
        var result = await CreateTrackedPaymentAsync(paymentRequest, cancellationToken);
        return Ok(new PaymentStartResponse(result.PaymentUrl, _runtimeOptions!.Provider, orderId));
    }
    catch (Exception ex)
    {
        return GatewayFailure(new { message = ex.Message });
    }
}

public async Task<PaymentOperationResult> RequestSeminarPayment(SeminarPaymentRequest request, CancellationToken cancellationToken)
{
    if (!TryGetCurrentUserId(out var userId))
        return Unauthorized();

    var seminar = await _seminarQueriesRepository.GetSeminarByIdExecuteAsync(new GetSeminarByIdQuery { SeminarId = request.SeminarId });
    if (seminar == null)
        return NotFound(new { message = "Seminar not found." });

    if (seminar.IsFree || seminar.Price <= 0)
        return BadRequest(new { message = "This seminar does not require online payment." });

    if (DateTime.UtcNow > seminar.EndTime)
        return BadRequest(new { message = "This seminar has expired." });

    if (!seminar.IsPublic || (seminar.Status != 1 && seminar.Status != 2))
        return BadRequest(new { message = "Registration is not available for this seminar." });

    var registered = await _seminarQueriesRepository.GetMyRegisteredSeminarsAsync(new GetMyRegisteredSeminarsQuery { UserId = userId });
    if (registered.Any(x => x.SeminarId == request.SeminarId && x.HasPaid))
        return BadRequest(new { message = "You are already registered for this seminar." });

    if (!await EnsureGatewayAsync(cancellationToken))
        return Unavailable(new { message = _gatewayError });

    var currentUser = await _userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = userId });
    var orderId = BuildOrderId(PaymentTargetType.Seminar, request.SeminarId, userId);
    var paymentRequest = new PaymentStartRequest(
        orderId,
        ToGatewayAmount(seminar.Price),
        BuildCallbackUrl(orderId),
        $"Seminar {seminar.Title}",
        currentUser?.FullName,
        currentUser?.Email,
        currentUser?.PhoneNumber);

    try
    {
        var result = await CreateTrackedPaymentAsync(paymentRequest, cancellationToken);
        return Ok(new PaymentStartResponse(result.PaymentUrl, _runtimeOptions!.Provider, orderId));
    }
    catch (Exception ex)
    {
        return GatewayFailure(new { message = ex.Message });
    }
}

public async Task<PaymentOperationResult> RequestAdSubscriptionPayment(AdSubscriptionPaymentRequest request, CancellationToken cancellationToken)
{
    if (!TryGetCurrentUserId(out var userId))
        return Unauthorized();

    var tariff = await _teacherCommandRepository.GetTariffByIdAsync(request.TariffId, cancellationToken);
    if (tariff == null)
        return NotFound(new { message = "Tariff not found." });

    var teacher = await _teacherCommandRepository.GetByUserIdWithDetailsAsync(userId, cancellationToken);
    if (teacher == null)
        return NotFound(new { message = "Teacher profile not found." });

    if (!await EnsureGatewayAsync(cancellationToken))
        return Unavailable(new { message = _gatewayError });

    var currentUser = await _userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = userId });
    var orderId = BuildOrderId(PaymentTargetType.AdSubscription, request.TariffId, userId);
    var paymentRequest = new PaymentStartRequest(
        orderId,
        ToGatewayAmount(tariff.PriceToman),
        BuildCallbackUrl(orderId),
        $"Ad plan {tariff.StarLevel}★ / {tariff.DurationMonths}mo",
        currentUser?.FullName,
        currentUser?.Email,
        currentUser?.PhoneNumber);

    try
    {
        var result = await CreateTrackedPaymentAsync(paymentRequest, cancellationToken);
        return Ok(new PaymentStartResponse(result.PaymentUrl, _runtimeOptions!.Provider, orderId));
    }
    catch (Exception ex)
    {
        return GatewayFailure(new { message = ex.Message });
    }
}

public async Task<PaymentOperationResult> RequestAdContactUnlockPayment(AdContactUnlockPaymentRequest request, CancellationToken cancellationToken)
{
    if (!TryGetCurrentUserId(out var userId))
        return Unauthorized();

    var teacher = await _teacherCommandRepository.GetByIdWithDetailsAsync(request.TeacherId, cancellationToken);
    if (teacher?.Advertisement is null || !teacher.Advertisement.IsPublic)
        return NotFound(new { message = "Advertisement not found." });

    if (await _advertisingEntitlements.HasPaidFeaturesAsync(teacher, cancellationToken))
        return BadRequest(new { message = "Contact is already visible for this teacher." });

    var existingUnlock = await _teacherCommandRepository.GetValidContactUnlockAsync(userId, teacher.Id, cancellationToken);
    if (existingUnlock != null)
        return BadRequest(new { message = "Contact is already unlocked." });

    var settings = await _teacherCommandRepository.GetOrCreateMonetizationSettingsAsync(cancellationToken);
    if (!await EnsureGatewayAsync(cancellationToken))
        return Unavailable(new { message = _gatewayError });

    var currentUser = await _userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = userId });
    var orderId = BuildOrderId(PaymentTargetType.AdContactUnlock, request.TeacherId, userId);
    var paymentRequest = new PaymentStartRequest(
        orderId,
        ToGatewayAmount(settings.ContactUnlockPriceToman),
        BuildCallbackUrl(orderId),
        $"Contact unlock — teacher {teacher.Id}",
        currentUser?.FullName,
        currentUser?.Email,
        currentUser?.PhoneNumber);

    try
    {
        var result = await CreateTrackedPaymentAsync(paymentRequest, cancellationToken);
        return Ok(new PaymentStartResponse(result.PaymentUrl, _runtimeOptions!.Provider, orderId));
    }
    catch (Exception ex)
    {
        return GatewayFailure(new { message = ex.Message });
    }
}

public async Task<PaymentOperationResult> RequestAdOneTimeBumpPayment(CancellationToken cancellationToken)
{
    if (!TryGetCurrentUserId(out var userId))
        return Unauthorized();

    var teacher = await _teacherCommandRepository.GetByUserIdWithDetailsAsync(userId, cancellationToken);
    if (teacher?.Advertisement is null)
        return NotFound(new { message = "Advertisement not found." });

    var settings = await _teacherCommandRepository.GetOrCreateMonetizationSettingsAsync(cancellationToken);
    if (!await EnsureGatewayAsync(cancellationToken))
        return Unavailable(new { message = _gatewayError });

    var currentUser = await _userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = userId });
    var orderId = BuildOrderId(PaymentTargetType.AdOneTimeBump, teacher.Id, userId);
    var paymentRequest = new PaymentStartRequest(
        orderId,
        ToGatewayAmount(settings.OneTimeBumpPriceToman),
        BuildCallbackUrl(orderId),
        $"One-time bump — teacher {teacher.Id}",
        currentUser?.FullName,
        currentUser?.Email,
        currentUser?.PhoneNumber);

    try
    {
        var result = await CreateTrackedPaymentAsync(paymentRequest, cancellationToken);
        return Ok(new PaymentStartResponse(result.PaymentUrl, _runtimeOptions!.Provider, orderId));
    }
    catch (Exception ex)
    {
        return GatewayFailure(new { message = ex.Message });
    }
}

public async Task<PaymentOperationResult> RequestAdAutoBumpPackagePayment(AdAutoBumpPackagePaymentRequest request, CancellationToken cancellationToken)
{
    if (!TryGetCurrentUserId(out var userId))
        return Unauthorized();

    var package = await _teacherCommandRepository.GetAutoBumpPackageByIdAsync(request.PackageId, cancellationToken);
    if (package == null)
        return NotFound(new { message = "Bump package not found." });

    var teacher = await _teacherCommandRepository.GetByUserIdWithDetailsAsync(userId, cancellationToken);
    if (teacher == null)
        return NotFound(new { message = "Teacher profile not found." });

    if (!await EnsureGatewayAsync(cancellationToken))
        return Unavailable(new { message = _gatewayError });

    var currentUser = await _userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = userId });
    var orderId = BuildOrderId(PaymentTargetType.AdAutoBumpPackage, request.PackageId, userId);
    var paymentRequest = new PaymentStartRequest(
        orderId,
        ToGatewayAmount(package.PriceToman),
        BuildCallbackUrl(orderId),
        $"Auto bump {package.DurationDays}d",
        currentUser?.FullName,
        currentUser?.Email,
        currentUser?.PhoneNumber);

    try
    {
        var result = await CreateTrackedPaymentAsync(paymentRequest, cancellationToken);
        return Ok(new PaymentStartResponse(result.PaymentUrl, _runtimeOptions!.Provider, orderId));
    }
    catch (Exception ex)
    {
        return GatewayFailure(new { message = ex.Message });
    }
}

public async Task<PaymentOperationResult> RequestEducationPlanInstallmentPayment(
    EducationPlanInstallmentPaymentRequest request,
    CancellationToken cancellationToken)
{
    if (!TryGetCurrentUserId(out var userId))
        return Unauthorized();

    var installment = await _educationPlanCommandRepository.GetInstallmentByIdAsync(request.InstallmentId, cancellationToken);
    if (installment?.EducationPlan is null || installment.EducationPlan.IsDelete)
        return NotFound(new { message = "Installment not found." });

    if (installment.IsPaid)
        return BadRequest(new { message = "This installment has already been paid." });

    var user = await _userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = userId });
    var studentIds = await _educationPlanQueryRepository.ResolveManagedStudentIdsForUserAsync(
        userId,
        user?.UserName ?? string.Empty,
        user?.Email,
        cancellationToken);

    if (!studentIds.Contains(installment.EducationPlan.ManagedRoomStudentId))
        return BadRequest(new { message = "You are not authorized to pay this installment." });

    if (!await EnsureGatewayAsync(cancellationToken))
        return Unavailable(new { message = _gatewayError });

    var currentUser = user;
    var orderId = BuildOrderId(PaymentTargetType.EducationPlanInstallment, request.InstallmentId, userId);
    var planTitle = installment.EducationPlan.Title?.ToString() ?? "Education Plan";
    var paymentRequest = new PaymentStartRequest(
        orderId,
        ToGatewayAmount(installment.AmountToman),
        BuildCallbackUrl(orderId),
        $"Plan installment #{installment.InstallmentNumber} — {planTitle}",
        currentUser?.FullName,
        currentUser?.Email,
        currentUser?.PhoneNumber);

    try
    {
        var result = await CreateTrackedPaymentAsync(paymentRequest, cancellationToken);
        return Ok(new PaymentStartResponse(result.PaymentUrl, _runtimeOptions!.Provider, orderId));
    }
    catch (Exception ex)
    {
        return GatewayFailure(new { message = ex.Message });
    }
}

public async Task<PaymentOperationResult> RequestCourseInstallmentPayment(
    CourseInstallmentPaymentRequest request,
    CancellationToken cancellationToken)
{
    if (!TryGetCurrentUserId(out var userId))
        return Unauthorized();

    var installment = await _enrollmentCommandRepository.GetInstallmentByIdAsync(request.InstallmentId, cancellationToken);
    if (installment?.Enrollment is null)
        return NotFound(new { message = "Installment not found." });

    if (installment.IsPaid)
        return BadRequest(new { message = "This installment has already been paid." });

    var studentId = await _studentQueryRepository.GetStudentIdByUserIdAsync(userId);
    if (!studentId.HasValue || installment.Enrollment.StudentId != studentId.Value)
        return BadRequest(new { message = "You are not authorized to pay this installment." });

    if (!await EnsureGatewayAsync(cancellationToken))
        return Unavailable(new { message = _gatewayError });

    var currentUser = await _userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = userId });
    var orderId = BuildOrderId(PaymentTargetType.CourseInstallment, request.InstallmentId, userId);
    var courseTitle = installment.Enrollment.Course?.Title?.Value ?? "Course";
    var paymentRequest = new PaymentStartRequest(
        orderId,
        ToGatewayAmount(installment.Amount),
        BuildCallbackUrl(orderId),
        $"Course installment #{installment.InstallmentNumber} — {courseTitle}",
        currentUser?.FullName,
        currentUser?.Email,
        currentUser?.PhoneNumber);

    try
    {
        var result = await CreateTrackedPaymentAsync(paymentRequest, cancellationToken);
        return Ok(new PaymentStartResponse(result.PaymentUrl, _runtimeOptions!.Provider, orderId));
    }
    catch (Exception ex)
    {
        return GatewayFailure(new { message = ex.Message });
    }
}

public async Task<PaymentOperationResult> RequestSupportPlanPayment(SupportPlanPaymentRequest request, CancellationToken cancellationToken)
{
    if (!TryGetCurrentUserId(out var userId))
        return Unauthorized();

    await _studentSupportSubscriptionRepository.EnsureDefaultTariffsAsync(cancellationToken);
    var tariff = await _studentSupportSubscriptionRepository.GetTariffByIdAsync(request.TariffId, cancellationToken);
    if (tariff == null)
        return NotFound(new { message = "Support plan not found." });

    tariff.EnsureDefaultFeatureRows();
    var selectedFeatures = tariff.NormalizeSelectedFeatures(request.FeatureCodes ?? []);
    var totalAmount = tariff.CalculateTotalPrice(selectedFeatures);
    await _studentSupportSubscriptionRepository.UpsertPendingPurchaseAsync(
        userId,
        tariff.Id,
        selectedFeatures,
        totalAmount,
        cancellationToken);
    await _studentSupportSubscriptionRepository.CommitAsync(cancellationToken);

    if (!await EnsureGatewayAsync(cancellationToken))
        return Unavailable(new { message = _gatewayError });

    var currentUser = await _userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = userId });
    var orderId = BuildOrderId(PaymentTargetType.SupportSubscription, request.TariffId, userId);
    var paymentRequest = new PaymentStartRequest(
        orderId,
        ToGatewayAmount(totalAmount),
        BuildCallbackUrl(orderId),
        $"Support plan {tariff.DurationMonths} month(s)",
        currentUser?.FullName,
        currentUser?.Email,
        currentUser?.PhoneNumber);

    try
    {
        var result = await CreateTrackedPaymentAsync(paymentRequest, cancellationToken);
        return Ok(new PaymentStartResponse(result.PaymentUrl, _runtimeOptions!.Provider, orderId));
    }
    catch (Exception ex)
    {
        return GatewayFailure(new { message = ex.Message });
    }
}

public async Task<PaymentOperationResult> Callback(
    string? paymentId,
    string? orderId,
    string? authority,
    string? gatewayStatus,
    string? trackId,
    string? zibalSuccess,
    CancellationToken cancellationToken)
{
    if (!await EnsureGatewayAsync(cancellationToken))
        return Content(_gatewayError ?? "The payment gateway is not configured.");

    if (!string.IsNullOrWhiteSpace(authority))
    {
        paymentId = authority;
        if (!string.Equals(gatewayStatus, "OK", StringComparison.OrdinalIgnoreCase))
            return Redirect(BuildClientResultUrl("failed", null, null, null, null, null, null, "پرداخت توسط کاربر لغو شد یا ناموفق بود."));
    }

    if (!string.IsNullOrWhiteSpace(trackId))
    {
        paymentId = trackId;
        if (!string.Equals(zibalSuccess, "1", StringComparison.OrdinalIgnoreCase))
            return Redirect(BuildClientResultUrl("failed", null, null, null, null, null, null, "پرداخت توسط کاربر لغو شد یا ناموفق بود."));
    }

    if (string.IsNullOrWhiteSpace(paymentId) || string.IsNullOrWhiteSpace(orderId))
        return BadRequest(new { message = "Payment identifiers are required." });
    try
    {
        return await trackedPayments.ProcessAsync<PaymentOperationResult>(orderId, paymentId, _runtimeOptions!, _runtimeGateway!,
            async (attempt, verified) =>
            {
                // Monetary conversion and destination come exclusively from the original server snapshot.
                _paymentAmountMultiplier = attempt.AmountMultiplier;
                var target = (PaymentTargetType)attempt.TargetType;
                var result = target switch
                {
                    PaymentTargetType.Invoice => await FinalizeInvoicePaymentAsync(attempt.TargetId, attempt.UserId, verified),
                    PaymentTargetType.Seminar => await FinalizeSeminarPaymentAsync(attempt.TargetId, attempt.UserId, verified),
                    PaymentTargetType.AdSubscription => await FinalizeAdSubscriptionPaymentAsync(attempt.TargetId, attempt.UserId, verified),
                    PaymentTargetType.AdContactUnlock => await FinalizeAdContactUnlockPaymentAsync(attempt.TargetId, attempt.UserId, verified),
                    PaymentTargetType.AdOneTimeBump => await FinalizeAdOneTimeBumpPaymentAsync(attempt.TargetId, attempt.UserId, verified),
                    PaymentTargetType.AdAutoBumpPackage => await FinalizeAdAutoBumpPackagePaymentAsync(attempt.TargetId, attempt.UserId, verified),
                    PaymentTargetType.EducationPlanInstallment => await FinalizeEducationPlanInstallmentPaymentAsync(attempt.TargetId, attempt.UserId, verified),
                    PaymentTargetType.CourseInstallment => await FinalizeCourseInstallmentPaymentAsync(attempt.TargetId, attempt.UserId, verified),
                    PaymentTargetType.SupportSubscription => await FinalizeSupportPlanPaymentAsync(attempt.TargetId, attempt.UserId, verified),
                    PaymentTargetType.WalletTopUp => await FinalizeWalletTopUpAsync(attempt.TargetId, attempt.UserId, verified),
                    _ => BadRequest(new { message = "Unsupported payment target." })
                };
                var successUrl = result is { Kind: PaymentOutcome.Redirect } redirect &&
                    Uri.TryCreate(redirect.Url, UriKind.Absolute, out var resultUri) &&
                    PaymentQueryString.ParseQuery(resultUri.Query).TryGetValue("status", out var status) && status == "success"
                    ? redirect.Url : null;
                return (result, successUrl);
            }, url => Redirect(url), cancellationToken);
    }
    catch (PaymentValidationException ex)
    {
        return Redirect(BuildClientResultUrl("failed", null, null, null, null, null, null, ex.Message));
    }
    catch (Exception ex) when (ex is not OperationCanceledException)
    {
        logger.LogError(ex, "Payment callback failed for {OrderId}", orderId);
        return Redirect(BuildClientResultUrl("failed", null, null, null, null, null, null,
            "Payment could not be finalized. Please retry or contact support with your payment reference."));
    }
}

private int? _paymentAmountMultiplier;
private int PaymentAmountMultiplier => _paymentAmountMultiplier ?? _runtimeOptions!.AmountMultiplier;

private Task<PaymentStartResult> CreateTrackedPaymentAsync(PaymentStartRequest request, CancellationToken cancellationToken)
{
    if (!TryParseOrderId(request.OrderId, out var target, out var entityId, out var userId))
        throw new InvalidOperationException("Invalid server payment request.");
    return trackedPayments.StartAsync(request, _runtimeOptions!, _runtimeGateway!, (int)target, entityId, userId, cancellationToken);
}

private async Task<PaymentOperationResult> FinalizeWalletTopUpAsync(long amountToman, long userId, PaymentVerifyResult verifyResult)
{
    var creditedAmount = ToApplicationAmount(verifyResult.Amount);
    var amountLong = Convert.ToInt64(Math.Round(creditedAmount, MidpointRounding.AwayFromZero));
    if (amountLong <= 0)
        return Redirect(BuildClientResultUrl("failed", PaymentTargetType.WalletTopUp, amountToman, null, null, null, verifyResult.ReferenceNumber, "Invalid top-up amount."));

    var reference = $"zibal:topup:{verifyResult.ReferenceNumber}";
    var (success, message) = await _userWalletService.CreditTopUpAsync(
        userId,
        amountLong,
        reference,
        "Zibal wallet top-up");

    if (!success)
        return Redirect(BuildClientResultUrl("failed", PaymentTargetType.WalletTopUp, amountToman, null, null, null, verifyResult.ReferenceNumber, message));

    return Redirect(BuildClientResultUrl("success", PaymentTargetType.WalletTopUp, amountToman, null, null, null, verifyResult.ReferenceNumber, "Wallet topped up successfully."));
}

private async Task<PaymentOperationResult> FinalizeInvoicePaymentAsync(long invoiceId, long userId, PaymentVerifyResult verifyResult)
{
    var myInvoices = await _invoiceQueryRepository.GetMyInvoicesAsync(new GetMyInvoicesQuery { UserId = userId })
        ?? new List<GetMyInvoicesQri>();
    var invoice = myInvoices
        .FirstOrDefault(x => x.Id == invoiceId);

    if (invoice == null)
        return Redirect(BuildClientResultUrl("failed", PaymentTargetType.Invoice, invoiceId, null, null, null, verifyResult.ReferenceNumber, "Invoice not found."));

    var invoiceDetail = await _invoiceQueryRepository.GetInvoiceByIdAsync(new GetInvoiceByIdQuery { InvoiceId = invoiceId });
    if (invoiceDetail == null)
        return Redirect(BuildClientResultUrl("failed", PaymentTargetType.Invoice, invoiceId, null, null, null, verifyResult.ReferenceNumber, "Invoice details were not found."));

    if (invoiceDetail.Transactions.Any(t => string.Equals(t.ReferenceNumber, verifyResult.ReferenceNumber, StringComparison.OrdinalIgnoreCase)))
    {
        await EnsurePaidInvoiceSideEffectsAsync(invoiceId);
        return Redirect(BuildClientResultUrl("success", PaymentTargetType.Invoice, invoiceId, null, null, null, verifyResult.ReferenceNumber, "پرداخت قبلاً تأیید شده بود."));
    }

    if (NormalizeStatus(invoice.Status) == "PAID")
    {
        await EnsurePaidInvoiceSideEffectsAsync(invoiceId);
        return Redirect(BuildClientResultUrl("success", PaymentTargetType.Invoice, invoiceId, null, null, null, verifyResult.ReferenceNumber, "پرداخت فاکتور قبلاً تکمیل شده بود."));
    }

    var expectedAmount = ToGatewayAmount(invoice.RemainingAmount);
    if (expectedAmount != verifyResult.Amount)
    {
        return Redirect(BuildClientResultUrl(
            "failed",
            PaymentTargetType.Invoice,
            invoiceId,
            null,
            null,
            null,
            verifyResult.ReferenceNumber,
            "The paid amount does not match the invoice amount."));
    }

    var command = new AddTransactionCommand
    {
        InvoiceId = invoiceId,
        Amount = ToApplicationAmount(verifyResult.Amount),
        ReferenceNumber = verifyResult.ReferenceNumber,
        Description = $"IDPay payment {verifyResult.PaymentId}"
    };

    var result = await commandDispatcher.Send<AddTransactionCommand, string>(command);
    if (result.Status != ApplicationServiceStatus.Ok)
    {
        return Redirect(BuildClientResultUrl(
            "failed",
            PaymentTargetType.Invoice,
            invoiceId,
            null,
            null,
            null,
            verifyResult.ReferenceNumber,
            string.Join(" ", result.Messages ?? Array.Empty<string>())));
    }

    return Redirect(BuildClientResultUrl("success", PaymentTargetType.Invoice, invoiceId, null, null, null, verifyResult.ReferenceNumber, "پرداخت فاکتور با موفقیت انجام شد."));
}

/// <summary>
/// برای فاکتورهای پرداخت‌شده‌ای که رویداد Outbox اجرا نشده، ثبت‌نام و اعتبار مالی استاد را جبران می‌کند.
/// </summary>
private async Task EnsurePaidInvoiceSideEffectsAsync(long invoiceId)
{
    try
    {
        await _teacherFinanceService.CreditCourseSalesFromInvoiceAsync(invoiceId);

        var invoice = await _invoiceQueryRepository.GetInvoiceByIdAsync(new GetInvoiceByIdQuery { InvoiceId = invoiceId });
        if (invoice == null) return;

        var order = await _orderQueryRepository.GetOrderByIdAsync(new GetOrderByIdQuery { OrderId = invoice.OrderId });
        if (order == null || order.OrderItems.Count == 0) return;

        var studentUserId = await _studentQueryRepository.GetUserIdByStudentIdAsync(order.StudentId);
        var user = studentUserId is > 0
            ? await _userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = studentUserId.Value })
            : null;
        var name = string.IsNullOrWhiteSpace(user?.FullName)
            ? user?.UserName ?? "دانشجو"
            : user!.FullName!;

        var items = order.OrderItems
            .Select(item => (
                item.CourseId,
                string.IsNullOrWhiteSpace(item.CourseTitle) ? $"دوره {item.CourseId}" : item.CourseTitle))
            .ToList();

        await _coursePurchaseFulfillmentService.FulfillOrderItemsAsync(
            order.StudentId,
            items,
            invoice.InvoiceNumber,
            invoice.TotalAmount,
            user?.Email,
            name);
    }
    catch
    {
        // Side effects are best-effort; payment result page must still succeed.
    }
}

private async Task<PaymentOperationResult> FinalizeSeminarPaymentAsync(long seminarId, long userId, PaymentVerifyResult verifyResult)
{
    var seminar = await _seminarQueriesRepository.GetSeminarByIdExecuteAsync(new GetSeminarByIdQuery { SeminarId = seminarId });
    if (seminar == null)
        return Redirect(BuildClientResultUrl("failed", PaymentTargetType.Seminar, null, seminarId, null, null, verifyResult.ReferenceNumber, "Seminar not found."));

    if (seminar.IsFree || seminar.Price <= 0)
        return Redirect(BuildClientResultUrl("failed", PaymentTargetType.Seminar, null, seminarId, null, null, verifyResult.ReferenceNumber, "This seminar does not require payment."));

    var registrations = await _seminarQueriesRepository.GetMyRegisteredSeminarsAsync(new GetMyRegisteredSeminarsQuery { UserId = userId });
    if (registrations.Any(x => x.SeminarId == seminarId && x.HasPaid))
        return Redirect(BuildClientResultUrl("success", PaymentTargetType.Seminar, null, seminarId, null, null, verifyResult.ReferenceNumber, "Seminar registration was already completed."));

    var expectedAmount = ToGatewayAmount(seminar.Price);
    if (expectedAmount != verifyResult.Amount)
    {
        return Redirect(BuildClientResultUrl(
            "failed",
            PaymentTargetType.Seminar,
            null,
            seminarId,
            null,
            null,
            verifyResult.ReferenceNumber,
            "The paid amount does not match the seminar amount."));
    }

    var command = new RegisterUserForSeminarCommand
    {
        SeminarId = seminarId,
        UserId = userId,
        HasPaid = true
    };

    var result = await commandDispatcher.Send<RegisterUserForSeminarCommand, string>(command);
    if (result.Status != ApplicationServiceStatus.Ok)
    {
        return Redirect(BuildClientResultUrl(
            "failed",
            PaymentTargetType.Seminar,
            null,
            seminarId,
            null,
            null,
            verifyResult.ReferenceNumber,
            string.Join(" ", result.Messages ?? Array.Empty<string>())));
    }

    return Redirect(BuildClientResultUrl("success", PaymentTargetType.Seminar, null, seminarId, null, null, verifyResult.ReferenceNumber, "Seminar registration completed successfully."));
}

private async Task<PaymentOperationResult> FinalizeAdSubscriptionPaymentAsync(long tariffId, long userId, PaymentVerifyResult verifyResult)
{
    var tariff = await _teacherCommandRepository.GetTariffByIdAsync(tariffId);
    if (tariff == null)
        return Redirect(BuildClientResultUrl("failed", PaymentTargetType.AdSubscription, null, null, tariffId, null, verifyResult.ReferenceNumber, "Tariff not found."));

    var teacher = await _teacherCommandRepository.GetByUserIdWithDetailsAsync(userId);
    if (teacher == null)
        return Redirect(BuildClientResultUrl("failed", PaymentTargetType.AdSubscription, null, null, tariffId, null, verifyResult.ReferenceNumber, "Teacher profile not found."));

    var expectedAmount = ToGatewayAmount(tariff.PriceToman);
    if (expectedAmount != verifyResult.Amount)
    {
        return Redirect(BuildClientResultUrl(
            "failed",
            PaymentTargetType.AdSubscription,
            null,
            null,
            tariffId,
            teacher.Id,
            verifyResult.ReferenceNumber,
            "The paid amount does not match the plan price."));
    }

    await _advertisingEntitlements.ActivateSubscriptionAsync(teacher, tariff, verifyResult.ReferenceNumber);
    await _advertisementBumpService.RecordRevenueAsync(
        AdvertisementRevenueType.Subscription,
        teacher.Id,
        userId,
        tariff.PriceToman,
        verifyResult.ReferenceNumber,
        $"Subscription {tariff.StarLevel}★ / {tariff.DurationMonths}mo");
    await _teacherCommandRepository.CommitAsync();
    await TrySendTeacherAdPlanEmailAsync(userId, teacher, tariff, verifyResult.ReferenceNumber);
    return Redirect(BuildClientResultUrl("success", PaymentTargetType.AdSubscription, null, null, tariffId, teacher.Id, verifyResult.ReferenceNumber, "Advertisement plan activated successfully."));
}

private async Task<PaymentOperationResult> FinalizeSupportPlanPaymentAsync(long tariffId, long userId, PaymentVerifyResult verifyResult)
{
    var tariff = await _studentSupportSubscriptionRepository.GetTariffByIdAsync(tariffId);
    if (tariff == null)
        return Redirect(BuildClientResultUrl("failed", PaymentTargetType.SupportSubscription, null, null, tariffId, null, verifyResult.ReferenceNumber, "Support plan not found."));

    var pending = await _studentSupportSubscriptionRepository.GetOpenPendingPurchaseAsync(userId, tariffId);
    var selectedFeatures = pending?.GetFeatureCodes() ?? [];
    tariff.EnsureDefaultFeatureRows();
    var expectedTotal = pending?.TotalAmountToman
        ?? tariff.CalculateTotalPrice(selectedFeatures);

    var expectedAmount = ToGatewayAmount(expectedTotal);
    if (expectedAmount != verifyResult.Amount)
    {
        return Redirect(BuildClientResultUrl(
            "failed",
            PaymentTargetType.SupportSubscription,
            null,
            null,
            tariffId,
            null,
            verifyResult.ReferenceNumber,
            "The paid amount does not match the plan price."));
    }

    var subscription = await _studentSupportSubscriptionRepository.GetOrCreateAsync(userId);
    var utcNow = DateTime.UtcNow;
    subscription.GrantMonths(tariff.DurationMonths, utcNow, userId, "purchase");
    subscription.GrantFeatures(selectedFeatures, utcNow);
    pending?.MarkConsumed();
    await _studentSupportSubscriptionRepository.CommitAsync();
    await TrySendStudentSupportPlanEmailAsync(userId, tariff, verifyResult.ReferenceNumber);

    return Redirect(BuildClientResultUrl(
        "success",
        PaymentTargetType.SupportSubscription,
        null,
        null,
        tariffId,
        null,
        verifyResult.ReferenceNumber,
        "Support plan activated successfully."));
}

private async Task<PaymentOperationResult> FinalizeAdContactUnlockPaymentAsync(long teacherId, long userId, PaymentVerifyResult verifyResult)
{
    var teacher = await _teacherCommandRepository.GetByIdWithDetailsAsync(teacherId);
    if (teacher?.Advertisement is null)
        return Redirect(BuildClientResultUrl("failed", PaymentTargetType.AdContactUnlock, null, null, null, teacherId, verifyResult.ReferenceNumber, "Advertisement not found."));

    var settings = await _teacherCommandRepository.GetOrCreateMonetizationSettingsAsync();
    var expectedAmount = ToGatewayAmount(settings.ContactUnlockPriceToman);
    if (expectedAmount != verifyResult.Amount)
    {
        return Redirect(BuildClientResultUrl(
            "failed",
            PaymentTargetType.AdContactUnlock,
            null,
            null,
            null,
            teacherId,
            verifyResult.ReferenceNumber,
            "The paid amount does not match the unlock price."));
    }

    var existing = await _teacherCommandRepository.GetValidContactUnlockAsync(userId, teacherId);
    if (existing != null)
        return Redirect(BuildClientResultUrl("success", PaymentTargetType.AdContactUnlock, null, null, null, teacherId, verifyResult.ReferenceNumber, "Contact was already unlocked."));

    var unlock = TeacherAdvertisementContactUnlock.Create(
        userId,
        teacherId,
        DateTime.UtcNow,
        settings.ContactUnlockHours,
        verifyResult.ReferenceNumber);
    await _teacherCommandRepository.AddContactUnlockAsync(unlock);
    await _advertisementBumpService.RecordRevenueAsync(
        AdvertisementRevenueType.ContactUnlock,
        teacherId,
        userId,
        settings.ContactUnlockPriceToman,
        verifyResult.ReferenceNumber,
        "Contact unlock");
    await _teacherCommandRepository.CommitAsync();
    return Redirect(BuildClientResultUrl("success", PaymentTargetType.AdContactUnlock, null, null, null, teacherId, verifyResult.ReferenceNumber, "Contact unlocked for 48 hours."));
}

private async Task<PaymentOperationResult> FinalizeAdOneTimeBumpPaymentAsync(long teacherId, long userId, PaymentVerifyResult verifyResult)
{
    var teacher = await _teacherCommandRepository.GetByIdWithDetailsAsync(teacherId);
    if (teacher?.Advertisement is null)
        return Redirect(BuildClientResultUrl("failed", PaymentTargetType.AdOneTimeBump, null, null, null, teacherId, verifyResult.ReferenceNumber, "Advertisement not found."));

    var settings = await _teacherCommandRepository.GetOrCreateMonetizationSettingsAsync();
    var expectedAmount = ToGatewayAmount(settings.OneTimeBumpPriceToman);
    if (expectedAmount != verifyResult.Amount)
    {
        return Redirect(BuildClientResultUrl(
            "failed",
            PaymentTargetType.AdOneTimeBump,
            null,
            null,
            null,
            teacherId,
            verifyResult.ReferenceNumber,
            "The paid amount does not match the bump price."));
    }

    await _advertisementBumpService.ExecuteOneTimeBumpAsync(
        teacher,
        userId,
        settings.OneTimeBumpPriceToman,
        verifyResult.ReferenceNumber);
    await _teacherCommandRepository.CommitAsync();
    return Redirect(BuildClientResultUrl("success", PaymentTargetType.AdOneTimeBump, null, null, null, teacherId, verifyResult.ReferenceNumber, "Listing bumped successfully."));
}

private async Task<PaymentOperationResult> FinalizeEducationPlanInstallmentPaymentAsync(
    long installmentId,
    long userId,
    PaymentVerifyResult verifyResult)
{
    var installment = await _educationPlanCommandRepository.GetInstallmentByIdAsync(installmentId);
    if (installment?.EducationPlan is null || installment.EducationPlan.IsDelete)
        return Redirect(BuildClientResultUrl("failed", PaymentTargetType.EducationPlanInstallment, null, null, null, null, verifyResult.ReferenceNumber, "Installment not found.", installmentId));

    if (installment.IsPaid)
        return Redirect(BuildClientResultUrl("success", PaymentTargetType.EducationPlanInstallment, null, null, null, null, verifyResult.ReferenceNumber, "Installment was already paid.", installmentId));

    var expectedAmount = ToGatewayAmount(installment.AmountToman);
    if (expectedAmount != verifyResult.Amount)
    {
        return Redirect(BuildClientResultUrl(
            "failed",
            PaymentTargetType.EducationPlanInstallment,
            null,
            null,
            null,
            null,
            verifyResult.ReferenceNumber,
            "The paid amount does not match the installment amount.",
            installmentId));
    }

    var command = new PayEducationPlanInstallmentCommand
    {
        InstallmentId = installmentId,
        UserId = userId,
        PaymentReference = verifyResult.ReferenceNumber,
    };

    var result = await commandDispatcher.Send<PayEducationPlanInstallmentCommand, string>(command);
    if (result.Status != ApplicationServiceStatus.Ok)
    {
        return Redirect(BuildClientResultUrl(
            "failed",
            PaymentTargetType.EducationPlanInstallment,
            null,
            null,
            null,
            null,
            verifyResult.ReferenceNumber,
            string.Join(" ", result.Messages ?? Array.Empty<string>()),
            installmentId));
    }

    return Redirect(BuildClientResultUrl(
        "success",
        PaymentTargetType.EducationPlanInstallment,
        null,
        null,
        null,
        null,
        verifyResult.ReferenceNumber,
        "Installment payment completed successfully.",
        installmentId));
}

private async Task<PaymentOperationResult> FinalizeCourseInstallmentPaymentAsync(
    long installmentId,
    long userId,
    PaymentVerifyResult verifyResult)
{
    var installment = await _enrollmentCommandRepository.GetInstallmentByIdAsync(installmentId);
    if (installment?.Enrollment is null)
        return Redirect(BuildClientResultUrl("failed", PaymentTargetType.CourseInstallment, null, null, null, null, verifyResult.ReferenceNumber, "Installment not found.", installmentId));

    if (installment.IsPaid)
        return Redirect(BuildClientResultUrl("success", PaymentTargetType.CourseInstallment, null, null, null, null, verifyResult.ReferenceNumber, "Installment was already paid.", installmentId));

    var expectedAmount = ToGatewayAmount(installment.Amount);
    if (expectedAmount != verifyResult.Amount)
    {
        return Redirect(BuildClientResultUrl(
            "failed",
            PaymentTargetType.CourseInstallment,
            null,
            null,
            null,
            null,
            verifyResult.ReferenceNumber,
            "The paid amount does not match the installment amount.",
            installmentId));
    }

    var command = new ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.PayCourseInstallment.PayCourseInstallmentCommand
    {
        InstallmentId = installmentId,
        UserId = userId,
        PaymentReference = verifyResult.ReferenceNumber,
    };

    var result = await commandDispatcher.Send<ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.PayCourseInstallment.PayCourseInstallmentCommand, string>(command);
    if (result.Status != ApplicationServiceStatus.Ok)
    {
        return Redirect(BuildClientResultUrl(
            "failed",
            PaymentTargetType.CourseInstallment,
            null,
            null,
            null,
            null,
            verifyResult.ReferenceNumber,
            string.Join(" ", result.Messages ?? Array.Empty<string>()),
            installmentId));
    }

    return Redirect(BuildClientResultUrl(
        "success",
        PaymentTargetType.CourseInstallment,
        null,
        null,
        null,
        null,
        verifyResult.ReferenceNumber,
        "Course installment payment completed successfully.",
        installmentId));
}

private async Task<PaymentOperationResult> FinalizeAdAutoBumpPackagePaymentAsync(long packageId, long userId, PaymentVerifyResult verifyResult)
{
    var package = await _teacherCommandRepository.GetAutoBumpPackageByIdAsync(packageId);
    if (package == null)
        return Redirect(BuildClientResultUrl("failed", PaymentTargetType.AdAutoBumpPackage, null, null, packageId, null, verifyResult.ReferenceNumber, "Bump package not found."));

    var teacher = await _teacherCommandRepository.GetByUserIdWithDetailsAsync(userId);
    if (teacher == null)
        return Redirect(BuildClientResultUrl("failed", PaymentTargetType.AdAutoBumpPackage, null, null, packageId, null, verifyResult.ReferenceNumber, "Teacher profile not found."));

    var expectedAmount = ToGatewayAmount(package.PriceToman);
    if (expectedAmount != verifyResult.Amount)
    {
        return Redirect(BuildClientResultUrl(
            "failed",
            PaymentTargetType.AdAutoBumpPackage,
            null,
            null,
            packageId,
            teacher.Id,
            verifyResult.ReferenceNumber,
            "The paid amount does not match the package price."));
    }

    await _advertisementBumpService.ActivateAutoBumpPackageAsync(
        teacher,
        package,
        userId,
        verifyResult.ReferenceNumber);
    await _teacherCommandRepository.CommitAsync();
    await TrySendTeacherAutoBumpEmailAsync(userId, teacher, package, verifyResult.ReferenceNumber);
    return Redirect(BuildClientResultUrl("success", PaymentTargetType.AdAutoBumpPackage, null, null, packageId, teacher.Id, verifyResult.ReferenceNumber, "Auto bump package activated."));
}

private async Task<bool> EnsureGatewayAsync(CancellationToken cancellationToken)
{
    if (_runtimeOptions != null && _runtimeGateway != null)
        return true;

    var options = await _gatewaySettingsProvider.GetAsync(cancellationToken);
    if (!PaymentGatewayConfigurationRules.TryEnsureConfigured(options, out var message))
    {
        _gatewayError = message;
        return false;
    }

    _runtimeOptions = options;
    _runtimeGateway = _gatewayFactory.Resolve(options.Provider);
    return true;
}

private string BuildCallbackUrl(string orderId)
    => $"{_runtimeOptions!.PublicApiBaseUrl.TrimEnd('/')}/api/Service/Payment/Callback?order_id={Uri.EscapeDataString(orderId)}";

private string BuildClientResultUrl(
    string status,
    PaymentTargetType? targetType,
    long? invoiceId,
    long? seminarId,
    long? tariffId,
    long? teacherId,
    string? referenceNumber,
    string? message,
    long? installmentId = null)
{
    var baseUrl = $"{_runtimeOptions!.ClientBaseUrl.TrimEnd('/')}/payments/result";
    var query = new Dictionary<string, string?>
    {
        ["status"] = status,
        ["type"] = targetType?.ToString().ToLowerInvariant(),
        ["invoiceId"] = invoiceId?.ToString(),
        ["seminarId"] = seminarId?.ToString(),
        ["tariffId"] = tariffId?.ToString(),
        ["teacherId"] = teacherId?.ToString(),
        ["installmentId"] = installmentId?.ToString(),
        ["ref"] = referenceNumber,
        ["message"] = message
    };

    return PaymentQueryString.AddQueryString(
        baseUrl,
        query
            .Where(x => !string.IsNullOrWhiteSpace(x.Value))
            .ToDictionary(x => x.Key, x => x.Value));
}

private long ToGatewayAmount(decimal applicationAmount)
    => checked((long)decimal.Round(applicationAmount * PaymentAmountMultiplier, 0, MidpointRounding.AwayFromZero));

private async Task TrySendTeacherAdPlanEmailAsync(long userId, Teacher teacher, AdvertisementTariff tariff, string referenceNumber)
{
    try
    {
        var user = await _userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = userId });
        if (user is null || string.IsNullOrWhiteSpace(user.Email))
            return;

        var expiry = DateTime.UtcNow.AddMonths(tariff.DurationMonths);
        await _transactionalEmailNotifier.SendTeacherAdPlanAsync(
            user.Email,
            user.FullName,
            $"{tariff.StarLevel}★ / {tariff.DurationMonths} ماه",
            TransactionalEmailFormatting.FormatAmountLabel(tariff.PriceToman),
            TransactionalEmailFormatting.FormatPersianDate(expiry));
    }
    catch
    {
        // Payment already succeeded; email failure must not affect redirect.
    }
}

private async Task TrySendTeacherAutoBumpEmailAsync(long userId, Teacher teacher, AdvertisementAutoBumpPackage package, string referenceNumber)
{
    try
    {
        var user = await _userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = userId });
        if (user is null || string.IsNullOrWhiteSpace(user.Email))
            return;

        await _transactionalEmailNotifier.SendTeacherAutoBumpAsync(
            user.Email,
            user.FullName,
            package.Name,
            TransactionalEmailFormatting.FormatAmountLabel(package.PriceToman),
            $"{package.DurationDays} روز");
    }
    catch
    {
    }
}

private async Task TrySendStudentSupportPlanEmailAsync(long userId, SupportPlanTariff tariff, string referenceNumber)
{
    try
    {
        var user = await _userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = userId });
        if (user is null || string.IsNullOrWhiteSpace(user.Email))
            return;

        var expiry = DateTime.UtcNow.AddMonths(tariff.DurationMonths);
        await _transactionalEmailNotifier.SendStudentSupportPlanAsync(
            user.Email,
            user.FullName,
            $"{tariff.DurationMonths} ماه",
            TransactionalEmailFormatting.FormatAmountLabel(tariff.PriceToman),
            TransactionalEmailFormatting.FormatPersianDate(expiry));
    }
    catch
    {
    }
}

private decimal ToApplicationAmount(long gatewayAmount)
    => gatewayAmount / (decimal)PaymentAmountMultiplier;

private static string NormalizeStatus(string? status)
    => (status ?? string.Empty).Trim().ToUpperInvariant();

private static string BuildOrderId(PaymentTargetType type, long entityId, long userId)
    => $"{type.ToString().ToUpperInvariant()}-{entityId}-U-{userId}-T-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}-{Guid.NewGuid():N}";

private static bool TryParseOrderId(string? orderId, out PaymentTargetType targetType, out long entityId, out long userId)
{
    targetType = default;
    entityId = 0;
    userId = 0;

    if (string.IsNullOrWhiteSpace(orderId))
        return false;

    var parts = orderId.Split('-', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    if (parts.Length < 4)
        return false;

    targetType = parts[0].ToUpperInvariant() switch
    {
        "INVOICE" => PaymentTargetType.Invoice,
        "SEMINAR" => PaymentTargetType.Seminar,
        "ADSUBSCRIPTION" => PaymentTargetType.AdSubscription,
        "ADCONTACTUNLOCK" => PaymentTargetType.AdContactUnlock,
        "ADONETIMEBUMP" => PaymentTargetType.AdOneTimeBump,
        "ADAUTOBUMPPACKAGE" => PaymentTargetType.AdAutoBumpPackage,
        "EDUCATIONPLANINSTALLMENT" => PaymentTargetType.EducationPlanInstallment,
        "COURSEINSTALLMENT" => PaymentTargetType.CourseInstallment,
        "SUPPORTSUBSCRIPTION" => PaymentTargetType.SupportSubscription,
        "WALLETTOPUP" => PaymentTargetType.WalletTopUp,
        _ => PaymentTargetType.Unknown
    };

    return targetType != PaymentTargetType.Unknown
        && long.TryParse(parts[1], out entityId)
        && string.Equals(parts[2], "U", StringComparison.OrdinalIgnoreCase)
        && long.TryParse(parts[3], out userId);
}

private bool TryGetCurrentUserId(out long userId)
{
    var claimValue = actor.Principal.FindFirst("userId")?.Value ?? actor.Principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    return long.TryParse(claimValue, out userId);
}
private static PaymentOperationResult Ok(object? data = null) => new(PaymentOutcome.Success, data);
private static PaymentOperationResult BadRequest(object? data = null) => new(PaymentOutcome.ValidationError, data);
private static PaymentOperationResult Unauthorized() => new(PaymentOutcome.Unauthorized);
private static PaymentOperationResult Forbid() => new(PaymentOutcome.Forbidden);
private static PaymentOperationResult NotFound(object? data = null) => new(PaymentOutcome.NotFound, data);
private static PaymentOperationResult Unavailable(object? data) => new(PaymentOutcome.GatewayUnavailable, data);
private static PaymentOperationResult GatewayFailure(object? data) => new(PaymentOutcome.GatewayFailure, data);
private static PaymentOperationResult Redirect(string url) => new(PaymentOutcome.Redirect, Url: url);
private static PaymentOperationResult Content(string content) => new(PaymentOutcome.Text, content);

}
