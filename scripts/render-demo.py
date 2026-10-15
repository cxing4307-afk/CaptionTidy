from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONT_PATH = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"
BOLD_PATH = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"


def caption_with(blocks, needle):
    for block in blocks:
        lines = block.strip().splitlines()
        text = "\n".join(lines[2:])
        if needle in text:
            return text
    raise RuntimeError(f"caption containing {needle!r} was not found")


before_blocks = (ROOT / "sample/example.srt").read_text(encoding="utf-8").split("\n\n")
after_blocks = (ROOT / "demo/example.tidy.srt").read_text(encoding="utf-8").split("\n\n")
before = caption_with(before_blocks, "切成四行")
after = caption_with(after_blocks, "切成四行")

image = Image.new("RGB", (1440, 760), "#f3f0e8")
draw = ImageDraw.Draw(image)
title_font = ImageFont.truetype(BOLD_PATH, 32)
label_font = ImageFont.truetype(BOLD_PATH, 23)
caption_font = ImageFont.truetype(FONT_PATH, 31)
small_font = ImageFont.truetype(FONT_PATH, 18)

draw.text((70, 52), "同一条字幕，整理前后", fill="#17211c", font=title_font)
draw.text((70, 105), "画面文字来自 sample/example.srt 和 tidy.js 的真实输出", fill="#66716b", font=small_font)


def panel(x, label, copy, accent, line_count):
    draw.rounded_rectangle((x, 170, x + 620, 680), radius=26, fill="#fffdf8", outline="#d8d8cf", width=2)
    draw.rounded_rectangle((x + 32, 202, x + 126, 246), radius=22, fill=accent)
    draw.text((x + 55, 210), label, fill="white", font=label_font)
    draw.text((x + 32, 282), f"{line_count} 行", fill="#66716b", font=small_font)

    box = (x + 32, 330, x + 588, 620)
    draw.rounded_rectangle(box, radius=18, fill="#17211c")
    bbox = draw.multiline_textbbox((0, 0), copy, font=caption_font, spacing=17, align="center")
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    text_x = x + 310 - text_width / 2
    text_y = 475 - text_height / 2
    draw.multiline_text((text_x, text_y), copy, fill="#ffffff", font=caption_font, spacing=17, align="center")


panel(70, "改前", before, "#a75818", len(before.splitlines()))
panel(750, "改后", after, "#176b4c", len(after.splitlines()))

output = ROOT / "demo/before-after.png"
image.save(output, optimize=True)
print(f"rendered {output.relative_to(ROOT)} from real SRT text")
