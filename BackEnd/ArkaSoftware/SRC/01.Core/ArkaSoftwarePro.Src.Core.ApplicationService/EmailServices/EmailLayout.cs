using System.Net;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices;

public static class EmailLayout
{
    public const string BrandName = "آرکا نرم افزار";
    public const string BrandPrimary = "#0061c1";
    public const string BrandPrimaryDark = "#004a94";
    public const string TextPrimary = "#1e293b";
    public const string TextMuted = "#64748b";
    public const string SurfaceMuted = "#f1f5f9";
    public const string BorderColor = "#e2e8f0";

    public static string Wrap(string pageTitle, string headerTitle, string contentHtml) =>
        $"""
        <!DOCTYPE html>
        <html lang="fa" dir="rtl" xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta name="color-scheme" content="light" />
          <meta name="supported-color-schemes" content="light" />
          <title>{Encode(pageTitle)}</title>
        </head>
        <body style="margin:0;padding:0;background-color:#eef2f7;font-family:Tahoma,'Segoe UI',Arial,sans-serif;direction:rtl;text-align:right;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" dir="rtl" style="background-color:#eef2f7;direction:rtl;">
            <tr>
              <td align="center" style="padding:32px 16px;direction:rtl;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" dir="rtl" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid {BorderColor};box-shadow:0 8px 24px rgba(15,23,42,0.08);direction:rtl;">
                  <tr>
                    <td dir="rtl" style="background:linear-gradient(135deg,{BrandPrimary} 0%,{BrandPrimaryDark} 100%);padding:28px 32px;text-align:right;direction:rtl;">
                      <p style="margin:0 0 6px;font-size:13px;color:rgba(255,255,255,0.85);text-align:right;direction:rtl;">{BrandName}</p>
                      <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;text-align:right;direction:rtl;">{Encode(headerTitle)}</h1>
                    </td>
                  </tr>
                  <tr>
                    <td dir="rtl" style="padding:32px;text-align:right;direction:rtl;">
                      {contentHtml}
                    </td>
                  </tr>
                  <tr>
                    <td dir="rtl" style="padding:20px 32px;background-color:{SurfaceMuted};border-top:1px solid {BorderColor};text-align:right;direction:rtl;">
                      <p style="margin:0 0 4px;font-size:14px;color:{TextPrimary};text-align:right;direction:rtl;">با احترام،</p>
                      <p style="margin:0;font-size:14px;font-weight:600;color:{BrandPrimary};text-align:right;direction:rtl;">تیم {BrandName}</p>
                    </td>
                  </tr>
                </table>
                <p style="margin:16px 0 0;font-size:12px;color:{TextMuted};text-align:center;direction:rtl;">
                  © {DateTime.UtcNow.Year} {BrandName}
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """;

    public static string ContentBlock(string innerHtml) =>
        $"""
        <div dir="rtl" style="direction:rtl;text-align:right;">
          {innerHtml}
        </div>
        """;

    public static string Encode(string? value) => WebUtility.HtmlEncode(value ?? string.Empty);

    public static string ToPersianDigits(int value)
    {
        var text = value.ToString();
        return string.Concat(text.Select(ch => ch switch
        {
            '0' => '۰',
            '1' => '۱',
            '2' => '۲',
            '3' => '۳',
            '4' => '۴',
            '5' => '۵',
            '6' => '۶',
            '7' => '۷',
            '8' => '۸',
            '9' => '۹',
            _ => ch
        }));
    }
}
