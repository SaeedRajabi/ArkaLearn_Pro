using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers;
using Microsoft.Extensions.Options;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.Teachers;

public sealed class AdvertisementModerationOptions
{
    public const string SectionName = "AdvertisementModeration";

    public bool Enabled { get; set; } = true;

    public string ApiKey { get; set; } = string.Empty;

    public string BaseUrl { get; set; } = "https://api.openai.com/v1";

    public string Model { get; set; } = "gpt-4o-mini";
}

public sealed class TeacherAdvertisementContentModerator(
    IHttpClientFactory httpClientFactory,
    IOptions<AdvertisementModerationOptions> options,
    ILogger<TeacherAdvertisementContentModerator> logger)
    : ITeacherAdvertisementContentModerator
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public async Task<TeacherAdvertisementModerationResult> EvaluateAsync(
        TeacherAdvertisementModerationInput input,
        CancellationToken cancellationToken = default)
    {
        var ruleViolation = TeacherAdvertisementContentPolicy.EvaluateTextFields(
            input.Title,
            input.WorkExperience,
            input.DescriptionHtml,
            input.Tags);

        if (ruleViolation != null)
            return new TeacherAdvertisementModerationResult(false, ruleViolation);

        var settings = options.Value;
        if (!settings.Enabled || string.IsNullOrWhiteSpace(settings.ApiKey))
            return new TeacherAdvertisementModerationResult(true, string.Empty);

        try
        {
            return await EvaluateWithAiAsync(input, settings, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Advertisement AI moderation failed; allowing save because rule checks passed.");
            return new TeacherAdvertisementModerationResult(true, string.Empty);
        }
    }

    private async Task<TeacherAdvertisementModerationResult> EvaluateWithAiAsync(
        TeacherAdvertisementModerationInput input,
        AdvertisementModerationOptions settings,
        CancellationToken cancellationToken)
    {
        var plainDescription = TeacherAdvertisementContentPolicy.StripHtml(input.DescriptionHtml);
        var tags = string.Join(", ", input.Tags ?? Array.Empty<string>());
        var model = string.IsNullOrWhiteSpace(settings.Model) ? "gpt-4o-mini" : settings.Model.Trim();

        var userPrompt =
            "Review this teacher advertisement for an online teaching marketplace.\n" +
            "ALLOW: teaching subjects, skills, technologies (e.g. ASP.NET Core, React, Next.js, C#, Python), work experience, credentials, architecture patterns, teaching style.\n" +
            "REJECT ONLY when text includes direct contact info, explicit URLs/domains, invitations to visit an external website, or social-media contact links.\n" +
            "Technology names with dots (ASP.NET, Next.js, .NET) are allowed.\n\n" +
            $"Title: {input.Title}\n" +
            $"Work experience: {input.WorkExperience}\n" +
            $"Description: {plainDescription}\n" +
            $"Tags: {tags}\n\n" +
            "Reply with JSON only: {\"allowed\":true|false,\"reason\":\"short Persian explanation for the teacher if rejected\"}";

        var payload = new
        {
            model,
            temperature = 0,
            response_format = new { type = "json_object" },
            messages = new object[]
            {
                new
                {
                    role = "system",
                    content =
                        "You moderate teacher ads on a learning platform. Allow professional bios and technology stacks. Reject only off-platform contact details, URLs, or brand redirect attempts. Respond JSON only.",
                },
                new { role = "user", content = userPrompt },
            },
        };

        var client = httpClientFactory.CreateClient(nameof(TeacherAdvertisementContentModerator));
        client.BaseAddress = new Uri(settings.BaseUrl.TrimEnd('/') + "/");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", settings.ApiKey.Trim());

        using var response = await client.PostAsync(
            "chat/completions",
            new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"),
            cancellationToken);

        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"OpenAI moderation failed: {(int)response.StatusCode} {body}");

        using var doc = JsonDocument.Parse(body);
        var content = doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString();

        if (string.IsNullOrWhiteSpace(content))
            throw new InvalidOperationException("OpenAI moderation returned empty content.");

        var parsed = JsonSerializer.Deserialize<AiModerationResponse>(content, JsonOptions);
        if (parsed is { Allowed: true })
            return new TeacherAdvertisementModerationResult(true, string.Empty);

        if (parsed is { Allowed: false })
        {
            var reason = string.IsNullOrWhiteSpace(parsed.Reason)
                ? "محتوای آگهی با قوانین پلتفرم سازگار نیست. لطفاً فقط مهارت‌ها و سوابق تدریس خود را بنویسید."
                : parsed.Reason.Trim();
            return new TeacherAdvertisementModerationResult(false, reason);
        }

        throw new InvalidOperationException("OpenAI moderation returned an invalid JSON payload.");
    }

    private sealed class AiModerationResponse
    {
        [JsonPropertyName("allowed")]
        public bool Allowed { get; set; }

        [JsonPropertyName("reason")]
        public string? Reason { get; set; }
    }
}
