"""Optional offline media task; never run by the website build or preview."""

import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys
from fractions import Fraction
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets/final_hq_infrayard.mp4"
OUTPUT = ROOT / "assets/infrayard-demo-with-music.mp4"
MUSIC_SHA256 = "f12cbb52bd4b92bd6cf8a343645567c119627e9cbf98108a3eb6ac2cc275ee46"
CREDIT = (
    'Music: "Dream Culture" by Kevin MacLeod (incompetech.com), '
    "https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1300046. "
    "Licensed under CC BY 4.0, https://creativecommons.org/licenses/by/4.0/. "
    "Changes: excerpt, reduced volume, fade in and fade out."
)

parser = argparse.ArgumentParser(description="Add the credited instrumental to the original demo, preserving video packets.")
parser.add_argument("--music", type=Path, required=True, help="Official Dream Culture.mp3 download; see assets/music/credits.md")
parser.add_argument("--ffmpeg", help="FFmpeg executable; otherwise use PATH or optional local imageio-ffmpeg")
args = parser.parse_args()
ffmpeg = args.ffmpeg or shutil.which("ffmpeg")
if not ffmpeg:
    sys.path.insert(0, str(ROOT / ".local-tools"))
    try:
        import imageio_ffmpeg
        ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        parser.error("Supply --ffmpeg or install FFmpeg. Website builds do not need this optional tool.")
if hashlib.sha256(args.music.read_bytes()).hexdigest() != MUSIC_SHA256:
    parser.error("Music does not match the verified official download. Check its provenance and credit before replacing it.")


def run(*options):
    result = subprocess.run([ffmpeg, "-hide_banner", "-nostdin", *map(str, options)], capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(result.stderr)
    return result


def video_signature(path):
    output = run("-v", "error", "-i", path, "-map", "0:v:0", "-c:v", "copy", "-f", "framehash", "-hash", "sha256", "-").stdout
    timebase = Fraction(re.search(r"#tb 0: (\d+/\d+)", output)[1])
    packets = [tuple(part.strip() for part in row.split(",")) for row in output.splitlines() if row and not row.startswith("#")]
    duration = max((int(packet[2]) + int(packet[3])) * timebase for packet in packets)
    headers = [row for row in output.splitlines() if row.startswith(("#extradata", "#dimensions", "#codec_id", "#sar", "#tb"))]
    return headers, packets, duration


def loudness(path, duration):
    report = run("-i", path, "-vn", "-af", f"atrim=duration={duration},loudnorm=I=-25:TP=-3:LRA=11:print_format=json", "-f", "null", "-").stderr
    return json.loads(re.findall(r'\{\s*"input_i"[\s\S]*?\}', report)[-1])


original_hash = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
original = video_signature(SOURCE)
duration = float(original[2])
measurement = loudness(args.music, duration)
gain = -25.0 - float(measurement["input_i"])
fade_out = duration - 6
audio_filter = (
    f"atrim=duration={duration:.6f},asetpts=PTS-STARTPTS,volume={gain:.2f}dB,"
    f"afade=t=in:st=0:d=2,afade=t=out:st={fade_out:.6f}:d=6,aresample=48000"
)
run("-y", "-i", SOURCE, "-i", args.music, "-map", "0:v:0", "-map", "1:a:0",
    "-c:v", "copy", "-af", audio_filter, "-c:a", "aac", "-b:a", "160k", "-ac", "2",
    "-t", f"{duration:.6f}", "-map_metadata", "0", "-metadata", "title=Infrayard product walkthrough",
    "-metadata", f"comment={CREDIT}", "-metadata:s:a:0", "handler_name=Instrumental music",
    "-movflags", "+faststart", OUTPUT)
if video_signature(OUTPUT) != original:
    raise RuntimeError("Video packet data, timing or dimensions changed.")
if hashlib.sha256(SOURCE.read_bytes()).hexdigest() != original_hash:
    raise RuntimeError("Original video changed.")
run("-v", "error", "-xerror", "-i", OUTPUT, "-f", "null", "-")
mixed = loudness(OUTPUT, duration)
if not -27 <= float(mixed["input_i"]) <= -23 or float(mixed["input_tp"]) > -3:
    raise RuntimeError(f"Unexpected output loudness: {mixed}")
print(json.dumps({"output": str(OUTPUT), "video_packets": len(original[1]), "duration_seconds": duration,
    "gain_db": round(gain, 2), "integrated_lufs": mixed["input_i"], "true_peak_dbtp": mixed["input_tp"],
    "original_sha256": original_hash, "output_sha256": hashlib.sha256(OUTPUT.read_bytes()).hexdigest()}, indent=2))
