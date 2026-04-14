#!/usr/bin/env python3
"""
Darija Translator – Python Client
==================================
Connects to the Jakarta REST service and translates text to Moroccan Darija.

Requirements:
    pip install requests

Usage:
    # CLI mode
    python translator_client.py --text "Hello, how are you?" --lang English

    # Interactive GUI (tkinter – built-in)
    python translator_client.py --gui
"""

import argparse
import base64
import json
import sys

import requests

# ─── Configuration ────────────────────────────────────────────────────────────
REST_URL  = "http://localhost:8080/darija-translator/api/translate"
USERNAME  = "admin"
PASSWORD  = "admin123"
TIMEOUT   = 30  # seconds


# ─── API Client ───────────────────────────────────────────────────────────────

def translate(text: str, source_language: str = "English",
              url: str = REST_URL,
              username: str = USERNAME,
              password: str = PASSWORD) -> str:
    """
    Call the REST /translate endpoint and return the Darija translation.
    Raises requests.HTTPError or RuntimeError on failure.
    """
    payload = {"text": text, "sourceLanguage": source_language}
    headers = {"Content-Type": "application/json"}

    response = requests.post(
        url,
        json=payload,
        headers=headers,
        auth=(username, password),
        timeout=TIMEOUT
    )
    response.raise_for_status()

    data = response.json()
    if data.get("status") == "error":
        raise RuntimeError(data.get("errorMessage", "Unknown error from server"))

    return data["translatedText"]


# ─── CLI Mode ─────────────────────────────────────────────────────────────────

def run_cli(args: argparse.Namespace) -> None:
    text = args.text or input("Enter text to translate: ").strip()
    if not text:
        print("Error: No text provided.", file=sys.stderr)
        sys.exit(1)

    print(f"\nTranslating ({args.lang}) → Darija …")
    try:
        result = translate(text, args.lang, args.url, args.username, args.password)
        print(f"\n{'─'*50}")
        print(f"Original : {text}")
        print(f"Darija   : {result}")
        print(f"{'─'*50}\n")
    except Exception as e:
        print(f"Translation failed: {e}", file=sys.stderr)
        sys.exit(1)


# ─── GUI Mode (tkinter) ───────────────────────────────────────────────────────

def run_gui(args: argparse.Namespace) -> None:
    import tkinter as tk
    from tkinter import ttk, messagebox

    root = tk.Tk()
    root.title("🇲🇦 Darija Translator – Python Client")
    root.geometry("680x560")
    root.configure(bg="#f0f4f8")
    root.resizable(True, True)

    BG         = "#f0f4f8"
    CARD_BG    = "#ffffff"
    GREEN_DARK = "#2d6a4f"
    GREEN      = "#40916c"
    FONT       = ("Segoe UI", 11)
    FONT_BOLD  = ("Segoe UI", 11, "bold")
    FONT_LARGE = ("Segoe UI", 13)

    # ── Header ──
    header = tk.Frame(root, bg=GREEN_DARK, pady=14, padx=18)
    header.pack(fill=tk.X, padx=16, pady=(16, 0))
    tk.Label(header, text="🇲🇦  Darija Translator",
             bg=GREEN_DARK, fg="white", font=("Segoe UI", 14, "bold")).pack(anchor="w")
    tk.Label(header, text="Translate to Moroccan Arabic Dialect via REST service",
             bg=GREEN_DARK, fg="#d1fae5", font=("Segoe UI", 9)).pack(anchor="w")

    # ── Settings ──
    settings_frame = tk.LabelFrame(root, text=" Server Settings ", font=FONT_BOLD,
                                   bg=CARD_BG, padx=10, pady=8)
    settings_frame.pack(fill=tk.X, padx=16, pady=10)

    url_var  = tk.StringVar(value=args.url)
    user_var = tk.StringVar(value=args.username)
    pass_var = tk.StringVar(value=args.password)

    tk.Label(settings_frame, text="URL:",      bg=CARD_BG, font=FONT).grid(row=0, column=0, sticky="w")
    tk.Entry(settings_frame, textvariable=url_var, width=48, font=FONT).grid(row=0, column=1, padx=6)
    tk.Label(settings_frame, text="User:",     bg=CARD_BG, font=FONT).grid(row=1, column=0, sticky="w")
    tk.Entry(settings_frame, textvariable=user_var, width=20, font=FONT).grid(row=1, column=1, sticky="w", padx=6)
    tk.Label(settings_frame, text="Password:", bg=CARD_BG, font=FONT).grid(row=2, column=0, sticky="w")
    tk.Entry(settings_frame, textvariable=pass_var, width=20, show="*", font=FONT).grid(row=2, column=1, sticky="w", padx=6)

    # ── Source ──
    src_frame = tk.LabelFrame(root, text=" Text to Translate ", font=FONT_BOLD,
                               bg=CARD_BG, padx=10, pady=8)
    src_frame.pack(fill=tk.BOTH, expand=True, padx=16, pady=4)

    lang_var = tk.StringVar(value="English")
    langs = ["English", "French", "Spanish", "Arabic (Modern Standard)", "German", "Italian"]
    lang_menu = ttk.Combobox(src_frame, textvariable=lang_var, values=langs,
                             state="readonly", width=30, font=FONT)
    lang_menu.pack(anchor="w", pady=(0, 6))

    src_text = tk.Text(src_frame, height=5, font=FONT_LARGE, wrap=tk.WORD,
                       relief=tk.FLAT, bd=1, highlightthickness=1,
                       highlightcolor=GREEN)
    src_text.pack(fill=tk.BOTH, expand=True)

    # ── Buttons ──
    btn_frame = tk.Frame(root, bg=BG)
    btn_frame.pack(fill=tk.X, padx=16, pady=6)

    status_var = tk.StringVar(value="")
    status_lbl = tk.Label(btn_frame, textvariable=status_var, bg=BG,
                          fg="#c53030", font=("Segoe UI", 9))
    status_lbl.pack(side=tk.LEFT)

    def do_translate():
        text = src_text.get("1.0", tk.END).strip()
        if not text:
            status_var.set("Please enter some text.")
            return
        status_var.set("Translating…")
        root.update()
        try:
            result = translate(text, lang_var.get(),
                               url_var.get(), user_var.get(), pass_var.get())
            out_text.delete("1.0", tk.END)
            out_text.insert(tk.END, result)
            status_var.set("✓ Translation complete")
        except Exception as e:
            status_var.set(f"Error: {e}")

    tk.Button(btn_frame, text="Translate to Darija ➜",
              bg=GREEN_DARK, fg="white", font=FONT_BOLD,
              relief=tk.FLAT, padx=14, pady=6,
              command=do_translate).pack(side=tk.RIGHT)

    # ── Output ──
    out_frame = tk.LabelFrame(root, text=" Darija Translation (دارجة) ", font=FONT_BOLD,
                               bg=CARD_BG, padx=10, pady=8)
    out_frame.pack(fill=tk.BOTH, expand=True, padx=16, pady=(0, 16))

    out_text = tk.Text(out_frame, height=5, font=("Segoe UI", 14), wrap=tk.WORD,
                       relief=tk.FLAT, bd=1, highlightthickness=1,
                       highlightcolor=GREEN, state=tk.NORMAL)
    out_text.pack(fill=tk.BOTH, expand=True)

    # Clear button
    def do_clear():
        src_text.delete("1.0", tk.END)
        out_text.delete("1.0", tk.END)
        status_var.set("")

    tk.Button(out_frame, text="🗑️ Clear", bg="#e53e3e", fg="white",
              font=FONT, relief=tk.FLAT, padx=10, pady=4,
              command=do_clear).pack(anchor="e", pady=(6, 0))

    root.mainloop()


# ─── Entry Point ──────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Darija Translator – Python Client")
    parser.add_argument("--text",     type=str, help="Text to translate (CLI mode)")
    parser.add_argument("--lang",     type=str, default="English", help="Source language")
    parser.add_argument("--url",      type=str, default=REST_URL,  help="REST service URL")
    parser.add_argument("--username", type=str, default=USERNAME,  help="Basic auth username")
    parser.add_argument("--password", type=str, default=PASSWORD,  help="Basic auth password")
    parser.add_argument("--gui",      action="store_true",         help="Launch GUI (tkinter)")

    args = parser.parse_args()

    if args.gui:
        run_gui(args)
    else:
        run_cli(args)


if __name__ == "__main__":
    main()
