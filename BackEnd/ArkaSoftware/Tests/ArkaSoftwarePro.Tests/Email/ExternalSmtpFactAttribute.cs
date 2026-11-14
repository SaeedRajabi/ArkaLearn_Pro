using Xunit;

namespace ArkaSoftwarePro.Tests.Email;

/// <summary>Real SMTP access must be explicitly enabled, including in a configured developer environment.</summary>
public sealed class ExternalSmtpFactAttribute : FactAttribute
{
    public ExternalSmtpFactAttribute()
    {
        if (Environment.GetEnvironmentVariable("ARKALEARN_RUN_LIVE_SMTP_TESTS") != "1")
            Skip = "External SMTP test: set ARKALEARN_RUN_LIVE_SMTP_TESTS=1 to opt in explicitly.";
    }
}
