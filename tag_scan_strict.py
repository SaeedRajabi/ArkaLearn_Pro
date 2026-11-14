import io

p = r"D:\Application\Csharp\ArkaLearn-Pro\FrontEnds\AdminDashboard\src\components\seminar\seminar-room.tsx"
src = io.open(p, encoding="utf-8", newline="").read()

start = src.find("Main area")  # scan from the Main area comment
end = src.find("<SeminarSettingsDialog")
seg = src[start:end]

# state machine: OUTSIDE (JSX children/tags) vs EXPRESSION braces vs strings
i = 0
n = len(seg)
line = 1
line_starts = [0]
for ch in seg:
    if ch == "\n":
        line_starts.append(len(seg))
# recompute line numbers on the fly instead
line = 1

stack = []  # element stack for tags
brace_depth_stack = []  # brace depth when entering a tag's children
brace_depth = 0
errors = []
tag_stack = []


def cur_line(idx):
    return seg.count("\n", 0, idx) + 1 + (src[:start].count("\n"))


while i < n:
    ch = seg[i]
    if ch == "<":
        # find end of tag
        j = i + 1
        depth_paren = 0
        while j < n:
            cj = seg[j]
            if cj == "{":
                # skip expression inside tag
                d = 1
                j += 1
                while j < n and d > 0:
                    if seg[j] == "{":
                        d += 1
                    elif seg[j] == "}":
                        d -= 1
                    elif seg[j] in "\"'":
                        q = seg[j]
                        j += 1
                        while j < n and seg[j] != q:
                            if seg[j] == "\\":
                                j += 1
                            j += 1
                    j += 1
                j -= 1
            elif cj == ">":
                break
            j += 1
        tag_src = seg[i : j + 1]
        ln = cur_line(i)
        if tag_src.startswith("</"):
            name = tag_src[2:].split(">")[0].strip().split(" ")[0]
            if tag_stack and tag_stack[-1][0] == name:
                tag_stack.pop()
            else:
                top = tag_stack[-1][0] + "@" + str(tag_stack[-1][1]) if tag_stack else "EMPTY"
                errors.append(f"line {ln}: </{name}> but open top is {top}")
        else:
            selfclose = tag_src.rstrip().endswith("/>")
            name = tag_src[1:].split(">")[0].split(" ")[0].split("\n")[0].strip()
            if not selfclose:
                tag_stack.append((name, ln))
        i = j + 1
        continue
    i += 1

print("UNCLOSED:", [(n2, l2) for n2, l2 in tag_stack])
for e in errors:
    print(e)
