using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using System.Windows;
using System.Windows.Documents;
using System.Windows.Media;

namespace ArkaLearnDesktop.App.Services;

/// <summary>Lightweight HTML ↔ FlowDocument for support-chat rich text (headings, bold, lists).</summary>
internal static class ChatHtmlFlowHelper
{
    private static readonly Regex BlockSplit = new(
        @"<(?<tag>h[1-6]|p|div|li|blockquote|pre|br\s*/?)(?:\s[^>]*)?>(?<inner>[\s\S]*?)(?:</\k<tag>>|(?<=br\s*/?>))",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex MediaStrip = new(
        @"<(?:audio|video)[\s\S]*?</(?:audio|video)>|<(?:img|source)\b[^>]*/?>",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex InlineTag = new(
        @"<(?<close>/?)(?<tag>strong|b|em|i|u|code|span|a)(?:\s[^>]*)?>",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public static string StripMediaTags(string? html)
    {
        if (string.IsNullOrWhiteSpace(html)) return string.Empty;
        return MediaStrip.Replace(html, " ").Trim();
    }

    public static FlowDocument ToFlowDocument(string? html, bool isMine)
    {
        var doc = new FlowDocument
        {
            PagePadding = new Thickness(0),
            TextAlignment = TextAlignment.Right,
            FlowDirection = FlowDirection.RightToLeft,
            FontFamily = new FontFamily("Segoe UI"),
            FontSize = 13.5,
            Foreground = ResolveForeground(isMine),
        };

        var cleaned = StripMediaTags(UnwrapEscapedAudio(html ?? string.Empty));
        if (string.IsNullOrWhiteSpace(cleaned) || !Regex.IsMatch(cleaned, @"<[^>]+>"))
        {
            var plain = WebUtility.HtmlDecode(Regex.Replace(cleaned, "<[^>]+>", " "));
            plain = Regex.Replace(plain, @"\s+", " ").Trim();
            if (plain.Length > 0)
                doc.Blocks.Add(CreateParagraph(plain, isMine, 13.5, FontWeights.Normal));
            return doc;
        }

        var matches = BlockSplit.Matches(cleaned);
        if (matches.Count == 0)
        {
            AppendInlineParagraph(doc, cleaned, isMine, 13.5, FontWeights.Normal);
            return doc;
        }

        var cursor = 0;
        foreach (Match match in matches)
        {
            if (match.Index > cursor)
            {
                var gap = cleaned[cursor..match.Index].Trim();
                if (gap.Length > 0)
                    AppendInlineParagraph(doc, gap, isMine, 13.5, FontWeights.Normal);
            }

            var tag = match.Groups["tag"].Value.Trim().ToLowerInvariant();
            if (tag.StartsWith("br", StringComparison.Ordinal))
            {
                doc.Blocks.Add(new Paragraph { Margin = new Thickness(0, 2, 0, 2) });
            }
            else
            {
                var (size, weight) = HeadingStyle(tag);
                AppendInlineParagraph(doc, match.Groups["inner"].Value, isMine, size, weight, tag == "li");
            }

            cursor = match.Index + match.Length;
        }

        if (cursor < cleaned.Length)
        {
            var tail = cleaned[cursor..].Trim();
            if (tail.Length > 0)
                AppendInlineParagraph(doc, tail, isMine, 13.5, FontWeights.Normal);
        }

        if (doc.Blocks.Count == 0)
        {
            var fallback = ChatHtmlHelper.Parse(html, string.Empty).Text;
            if (!string.IsNullOrWhiteSpace(fallback))
                doc.Blocks.Add(CreateParagraph(fallback, isMine, 13.5, FontWeights.Normal));
        }

        return doc;
    }

    public static string FlowDocumentToHtml(FlowDocument? document)
    {
        if (document is null) return string.Empty;
        var sb = new StringBuilder();
        foreach (var block in document.Blocks)
        {
            if (block is not Paragraph paragraph) continue;
            var inner = InlinesToHtml(paragraph.Inlines);
            if (string.IsNullOrWhiteSpace(Regex.Replace(inner, "<[^>]+>", "").Trim()) &&
                !inner.Contains("<br", StringComparison.OrdinalIgnoreCase))
                continue;

            var isHeading = paragraph.FontSize >= 18 || paragraph.FontWeight >= FontWeights.SemiBold && paragraph.FontSize >= 16;
            if (isHeading && paragraph.FontSize >= 18)
                sb.Append("<h2>").Append(inner).Append("</h2>");
            else
                sb.Append("<p>").Append(inner).Append("</p>");
        }

        var html = sb.ToString().Trim();
        return string.IsNullOrWhiteSpace(html) ? string.Empty : html;
    }

    public static string GetPlainText(FlowDocument? document)
    {
        if (document is null) return string.Empty;
        var sb = new StringBuilder();
        foreach (var block in document.Blocks)
        {
            if (block is Paragraph paragraph)
            {
                sb.Append(new TextRange(paragraph.ContentStart, paragraph.ContentEnd).Text);
                sb.Append(' ');
            }
        }

        return Regex.Replace(sb.ToString(), @"\s+", " ").Trim();
    }

    private static string UnwrapEscapedAudio(string html) =>
        html.Replace("&lt;audio", "<audio", StringComparison.OrdinalIgnoreCase)
            .Replace("&lt;/audio&gt;", "</audio>", StringComparison.OrdinalIgnoreCase)
            .Replace("&gt;", ">", StringComparison.OrdinalIgnoreCase);

    private static (double Size, FontWeight Weight) HeadingStyle(string tag) => tag switch
    {
        "h1" => (22, FontWeights.Bold),
        "h2" => (18, FontWeights.Bold),
        "h3" => (16, FontWeights.SemiBold),
        "h4" or "h5" or "h6" => (14.5, FontWeights.SemiBold),
        "blockquote" => (13.5, FontWeights.Normal),
        "pre" => (12.5, FontWeights.Normal),
        _ => (13.5, FontWeights.Normal),
    };

    private static Brush ResolveForeground(bool isMine)
    {
        if (isMine) return Brushes.White;
        try
        {
            if (System.Windows.Application.Current?.TryFindResource("TextPrimaryBrush") is Brush brush)
                return brush;
        }
        catch
        {
            // design-time / missing resource
        }

        return Brushes.Black;
    }

    private static Paragraph CreateParagraph(string text, bool isMine, double size, FontWeight weight) =>
        new(new Run(text) { Foreground = ResolveForeground(isMine) })
        {
            Margin = new Thickness(0, 2, 0, 2),
            FontSize = size,
            FontWeight = weight,
            TextAlignment = TextAlignment.Right,
        };

    private static void AppendInlineParagraph(
        FlowDocument doc,
        string htmlFragment,
        bool isMine,
        double size,
        FontWeight weight,
        bool bullet = false)
    {
        var paragraph = new Paragraph
        {
            Margin = new Thickness(0, 2, 0, 2),
            FontSize = size,
            FontWeight = weight,
            TextAlignment = TextAlignment.Right,
        };

        if (bullet)
            paragraph.Inlines.Add(new Run("• ") { Foreground = paragraph.Foreground });

        AppendInlines(paragraph.Inlines, htmlFragment, isMine, size, weight);
        if (paragraph.Inlines.Count > 0)
            doc.Blocks.Add(paragraph);
    }

    private static void AppendInlines(
        InlineCollection inlines,
        string html,
        bool isMine,
        double size,
        FontWeight baseWeight)
    {
        var brush = ResolveForeground(isMine);

        var bold = false;
        var italic = false;
        var underline = false;
        var code = false;
        var pos = 0;

        foreach (Match match in InlineTag.Matches(html))
        {
            if (match.Index > pos)
                inlines.Add(MakeRun(html[pos..match.Index], brush, size, baseWeight, bold, italic, underline, code));

            var tag = match.Groups["tag"].Value.ToLowerInvariant();
            var closing = match.Groups["close"].Value == "/";
            switch (tag)
            {
                case "strong":
                case "b":
                    bold = !closing;
                    break;
                case "em":
                case "i":
                    italic = !closing;
                    break;
                case "u":
                    underline = !closing;
                    break;
                case "code":
                    code = !closing;
                    break;
            }

            pos = match.Index + match.Length;
        }

        if (pos < html.Length)
            inlines.Add(MakeRun(html[pos..], brush, size, baseWeight, bold, italic, underline, code));
    }

    private static Run MakeRun(
        string raw,
        Brush brush,
        double size,
        FontWeight baseWeight,
        bool bold,
        bool italic,
        bool underline,
        bool code)
    {
        var text = WebUtility.HtmlDecode(Regex.Replace(raw, "<[^>]+>", ""));
        text = text.Replace('\u00a0', ' ');
        var run = new Run(text)
        {
            Foreground = brush,
            FontSize = code ? size - 1 : size,
            FontWeight = bold ? FontWeights.Bold : baseWeight,
            FontStyle = italic ? FontStyles.Italic : FontStyles.Normal,
        };
        if (underline)
            run.TextDecorations = TextDecorations.Underline;
        if (code)
            run.FontFamily = new FontFamily("Consolas");
        return run;
    }

    private static string InlinesToHtml(InlineCollection inlines)
    {
        var sb = new StringBuilder();
        foreach (var inline in inlines)
        {
            switch (inline)
            {
                case Run run:
                {
                    var text = WebUtility.HtmlEncode(run.Text);
                    if (run.FontWeight >= FontWeights.SemiBold) text = $"<strong>{text}</strong>";
                    if (run.FontStyle == FontStyles.Italic) text = $"<em>{text}</em>";
                    if (run.TextDecorations is { Count: > 0 })
                        text = $"<u>{text}</u>";
                    sb.Append(text);
                    break;
                }
                case LineBreak:
                    sb.Append("<br/>");
                    break;
                case Span span:
                    sb.Append(InlinesToHtml(span.Inlines));
                    break;
            }
        }

        return sb.ToString();
    }
}
