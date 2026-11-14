namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices;

public static class EmailTemplateParts
{
    public static string Paragraph(string text) =>
        $"""
        <p style="margin:0 0 16px;font-size:15px;line-height:1.9;color:{EmailLayout.TextMuted};text-align:right;direction:rtl;">
          {text}
        </p>
        """;

    public static string Greeting(string recipientNamePlaceholder = "{{recipientName}}") =>
        $"""
        <p style="margin:0 0 16px;font-size:16px;line-height:1.9;color:{EmailLayout.TextPrimary};text-align:right;direction:rtl;">
          سلام <strong style="color:{EmailLayout.BrandPrimary};">{recipientNamePlaceholder}</strong>،
        </p>
        """;

    public static string CtaButton(string urlPlaceholder = "{{ctaUrl}}", string labelPlaceholder = "{{ctaLabel}}") =>
        $"""
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" dir="rtl" style="margin:24px 0;">
          <tr>
            <td align="center">
              <a href="{urlPlaceholder}" style="display:inline-block;background:linear-gradient(135deg,{EmailLayout.BrandPrimary} 0%,{EmailLayout.BrandPrimaryDark} 100%);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600;">
                {labelPlaceholder}
              </a>
            </td>
          </tr>
        </table>
        """;

    public static string InvoiceTable(string rowsHtml) =>
        $"""
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" dir="rtl" style="margin:20px 0;border:1px solid {EmailLayout.BorderColor};border-radius:12px;overflow:hidden;">
          <tr style="background-color:{EmailLayout.SurfaceMuted};">
            <td style="padding:12px 16px;font-size:14px;font-weight:600;color:{EmailLayout.TextPrimary};text-align:right;">شرح</td>
            <td style="padding:12px 16px;font-size:14px;font-weight:600;color:{EmailLayout.TextPrimary};text-align:left;">مبلغ</td>
          </tr>
          {rowsHtml}
        </table>
        """;

    public static string InvoiceRow(string label, string amount) =>
        $"""
        <tr>
          <td style="padding:12px 16px;font-size:14px;color:{EmailLayout.TextMuted};text-align:right;border-top:1px solid {EmailLayout.BorderColor};">{label}</td>
          <td style="padding:12px 16px;font-size:14px;color:{EmailLayout.TextPrimary};text-align:left;border-top:1px solid {EmailLayout.BorderColor};">{amount}</td>
        </tr>
        """;

    public static string InfoBox(string text) =>
        $"""
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" dir="rtl" style="margin:16px 0;">
          <tr>
            <td style="background-color:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;text-align:right;direction:rtl;">
              <p style="margin:0;font-size:14px;line-height:1.8;color:#92400e;">{text}</p>
            </td>
          </tr>
        </table>
        """;

    public static string CodeBox(string label, string codeVariable) =>
        $"""
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" dir="rtl" style="margin:0 0 24px;">
          <tr>
            <td align="center" style="padding:0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,{EmailLayout.SurfaceMuted} 0%,#ffffff 100%);border:1px solid {EmailLayout.BorderColor};border-radius:12px;min-width:220px;">
                <tr>
                  <td align="center" style="padding:20px 32px;">
                    <p style="margin:0 0 8px;font-size:13px;color:{EmailLayout.TextMuted};text-align:center;">{label}</p>
                    <p dir="ltr" style="margin:0;font-size:34px;font-weight:700;letter-spacing:10px;color:{EmailLayout.BrandPrimaryDark};text-align:center;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">
                      {codeVariable}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        """;
}
