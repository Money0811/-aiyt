r"""CPU fine-tuning pipeline for clean UVR5-separated Claude OBS vocal dataset.

Configured to saturate all 12 CPU threads (OMP/MKL/PyTorch) and save checkpoints
frequently (SoVITS every 2 epochs, GPT every 4 epochs) so training can be resumed.
"""

from __future__ import annotations

import argparse
import json
import os
import runpy
import subprocess
import sys
from pathlib import Path

import yaml

ROOT_DIR = Path(__file__).resolve().parent.parent
GSV_DIR = ROOT_DIR / "tools" / "GPT-SoVITS"
GSV_PY = GSV_DIR / ".venv" / "Scripts" / "python.exe"
EXP_NAME = "claude_clean"
OPT_DIR = GSV_DIR / "logs" / EXP_NAME
LIST_PATH = GSV_DIR / "output" / "claude_asr" / "claude_obs.list"
SLICER_DIR = GSV_DIR / "output" / "claude_obs_slicer"

TEXT_FIXES: list[tuple[str, str]] = [
    ("Cloud", "Claude"),
    ("Open AI", "OpenAI"),
    ("Deep Seek", "DeepSeek"),
    ("Anti Gravity", "Antigravity"),
]


def apply_thread_env(threads: int) -> None:
    import torch

    t_str = str(threads)
    os.environ["OMP_NUM_THREADS"] = t_str
    os.environ["MKL_NUM_THREADS"] = t_str
    os.environ["NUMEXPR_NUM_THREADS"] = t_str
    os.environ["OPENBLAS_NUM_THREADS"] = t_str
    torch.set_num_threads(threads)


def clean_asr_list() -> None:
    text = LIST_PATH.read_text(encoding="utf-8")
    for old, new in TEXT_FIXES:
        text = text.replace(old, new)
    LIST_PATH.write_text(text, encoding="utf-8")


def run_prep(threads: int) -> None:
    import types

    apply_thread_env(threads)
    clean_asr_list()
    OPT_DIR.mkdir(parents=True, exist_ok=True)
    os.chdir(GSV_DIR)
    sys.path.insert(0, str(GSV_DIR))
    sys.path.insert(0, str(GSV_DIR / "GPT_SoVITS"))
    if "gradio" not in sys.modules:
        sys.modules["gradio"] = types.ModuleType("gradio")

    common_env = {
        "inp_text": str(LIST_PATH),
        "inp_wav_dir": str(SLICER_DIR),
        "exp_name": EXP_NAME,
        "i_part": "0",
        "all_parts": "1",
        "opt_dir": str(OPT_DIR),
        "is_half": "False",
        "version": "v2",
        "bert_pretrained_dir": str(GSV_DIR / "GPT_SoVITS" / "pretrained_models" / "chinese-roberta-wwm-ext-large"),
        "cnhubert_base_dir": str(GSV_DIR / "GPT_SoVITS" / "pretrained_models" / "chinese-hubert-base"),
        "pretrained_s2G": str(GSV_DIR / "GPT_SoVITS" / "pretrained_models" / "gsv-v2final-pretrained" / "s2G2333k.pth"),
        "s2config_path": str(GSV_DIR / "GPT_SoVITS" / "configs" / "s2.json"),
    }
    for k, v in common_env.items():
        os.environ[k] = v

    for script_name in ("1-get-text.py", "2-get-hubert-wav32k.py", "3-get-semantic.py"):
        print(f"\n=== Running {script_name} ===")
        runpy.run_path(str(GSV_DIR / "GPT_SoVITS" / "prepare_datasets" / script_name), run_name="__main__")

    part_txt = OPT_DIR / "2-name2text-0.txt"
    merged_txt = OPT_DIR / "2-name2text.txt"
    if part_txt.exists():
        merged_txt.write_text(part_txt.read_text(encoding="utf-8"), encoding="utf-8")

    part_sem = OPT_DIR / "6-name2semantic-0.tsv"
    merged_sem = OPT_DIR / "6-name2semantic.tsv"
    if part_sem.exists():
        merged_sem.write_text(part_sem.read_text(encoding="utf-8"), encoding="utf-8")


def write_train_configs() -> tuple[Path, Path]:
    s2_cfg = json.loads((GSV_DIR / "GPT_SoVITS" / "configs" / "s2.json").read_text(encoding="utf-8"))
    s2_cfg["train"]["epochs"] = 6
    s2_cfg["train"]["batch_size"] = 2
    s2_cfg["train"]["fp16_run"] = False
    s2_cfg["train"]["save_every_epoch"] = 2
    s2_cfg["train"]["if_save_latest"] = True
    s2_cfg["train"]["if_save_every_weights"] = True
    s2_cfg["train"]["gpu_numbers"] = ""
    s2_cfg["train"]["pretrained_s2G"] = "GPT_SoVITS/pretrained_models/gsv-v2final-pretrained/s2G2333k.pth"
    s2_cfg["train"]["pretrained_s2D"] = "GPT_SoVITS/pretrained_models/gsv-v2final-pretrained/s2D2333k.pth"
    s2_cfg["model"]["version"] = "v2"
    s2_cfg["data"]["exp_dir"] = str(OPT_DIR)
    s2_cfg["s2_ckpt_dir"] = str(OPT_DIR)
    s2_cfg["save_weight_dir"] = str(GSV_DIR / "SoVITS_weights_v2")
    s2_cfg["name"] = EXP_NAME
    (GSV_DIR / "SoVITS_weights_v2").mkdir(parents=True, exist_ok=True)
    s2_cfg_path = OPT_DIR / "s2_claude_clean.json"
    s2_cfg_path.write_text(json.dumps(s2_cfg, ensure_ascii=False, indent=2), encoding="utf-8")

    s1_cfg = yaml.safe_load((GSV_DIR / "GPT_SoVITS" / "configs" / "s1longer-v2.yaml").read_text(encoding="utf-8"))
    s1_cfg["train"]["epochs"] = 12
    s1_cfg["train"]["batch_size"] = 2
    s1_cfg["train"]["save_every_n_epoch"] = 4
    s1_cfg["train"]["precision"] = "32-true"
    s1_cfg["train"]["if_save_latest"] = True
    s1_cfg["train"]["if_save_every_weights"] = True
    s1_cfg["train"]["half_weights_save_dir"] = str(GSV_DIR / "GPT_weights_v2")
    s1_cfg["train"]["exp_name"] = EXP_NAME
    s1_cfg["data"]["num_workers"] = 2
    s1_cfg["pretrained_s1"] = "GPT_SoVITS/pretrained_models/gsv-v2final-pretrained/s1bert25hz-5kh-longer-epoch=12-step=369668.ckpt"
    s1_cfg["train_semantic_path"] = str(OPT_DIR / "6-name2semantic.tsv")
    s1_cfg["train_phoneme_path"] = str(OPT_DIR / "2-name2text.txt")
    s1_cfg["output_dir"] = str(OPT_DIR / "logs_s1_v2")
    (GSV_DIR / "GPT_weights_v2").mkdir(parents=True, exist_ok=True)
    s1_cfg_path = OPT_DIR / "s1_claude_clean.yaml"
    s1_cfg_path.write_text(yaml.safe_dump(s1_cfg, allow_unicode=True), encoding="utf-8")

    return s2_cfg_path, s1_cfg_path


def run_training(s2_cfg_path: Path, s1_cfg_path: Path, threads: int, s1_only: bool = False) -> None:
    (OPT_DIR / "logs_s2_v2").mkdir(parents=True, exist_ok=True)
    (OPT_DIR / "logs_s1_v2").mkdir(parents=True, exist_ok=True)
    stub_dir = OPT_DIR / "_stub"
    stub_dir.mkdir(parents=True, exist_ok=True)
    (stub_dir / "gradio.py").write_text("# Stub for headless DataLoader workers\n", encoding="utf-8")

    env = os.environ.copy()
    t_str = str(threads)
    env["OMP_NUM_THREADS"] = t_str
    env["MKL_NUM_THREADS"] = t_str
    env["NUMEXPR_NUM_THREADS"] = t_str
    env["OPENBLAS_NUM_THREADS"] = t_str
    env["PYTHONPATH"] = os.pathsep.join([
        str(stub_dir),
        str(GSV_DIR / "GPT_SoVITS"),
        str(GSV_DIR),
        env.get("PYTHONPATH", ""),
    ])

    if not s1_only:
        print(f"\n=== Stage 1: Training SoVITS ({EXP_NAME}, 6 epochs, {threads} CPU threads) ===")
        subprocess.run(
            [str(GSV_PY), "GPT_SoVITS/s2_train.py", "--config", str(s2_cfg_path)],
            cwd=str(GSV_DIR),
            env=env,
            check=True,
        )

    print(f"\n=== Stage 2: Training GPT ({EXP_NAME}, 12 epochs, {threads} CPU threads) ===")
    subprocess.run(
        [str(GSV_PY), "GPT_SoVITS/s1_train.py", "--config_file", str(s1_cfg_path)],
        cwd=str(GSV_DIR),
        env=env,
        check=True,
    )

    print(f"\n✅ {EXP_NAME} training complete!")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--prep-only", action="store_true")
    parser.add_argument("--skip-prep", action="store_true")
    parser.add_argument("--s1-only", action="store_true")
    parser.add_argument("--threads", type=int, default=12)
    args = parser.parse_args()

    if not args.skip_prep and not args.s1_only:
        run_prep(args.threads)
    if args.prep_only:
        return
    s2_cfg_path, s1_cfg_path = write_train_configs()
    run_training(s2_cfg_path, s1_cfg_path, threads=args.threads, s1_only=args.s1_only)


if __name__ == "__main__":
    main()
