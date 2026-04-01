#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Sequence Frame Animator - View animation frames
"""
import os
import json
import re
import tkinter as tk
from tkinter import ttk
from pathlib import Path
from PIL import Image, ImageTk
import threading
import time

IMAGE_EXTS = {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'}

def natural_sort_key(s):
    return [int(x) if x.isdigit() else x.lower() for x in re.split(r'(\d+)', str(s))]

class FrameAnimator:
    def __init__(self, root):
        self.root = root
        self.root.title("Sequence Frame Animator")
        self.root.geometry("900x700")
        self.root.configure(bg='#1a1a2e')

        self.animations = []
        self.current_anim = None
        self.current_frame = 0
        self.playing = False
        self.interval = 100
        self.scale = 1.0

        self.setup_ui()
        self.load_config()

    def setup_ui(self):
        # Main frame
        main_frame = tk.Frame(self.root, bg='#1a1a2e')
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # Left panel - animation list
        left_panel = tk.Frame(main_frame, bg='#16213e', width=200)
        left_panel.pack(side=tk.LEFT, fill=tk.Y, padx=(0, 10))
        left_panel.pack_propagate(False)

        tk.Label(left_panel, text="Animations", bg='#16213e', fg='#ffdd57',
                font=('Arial', 12, 'bold')).pack(pady=10)

        # Animation listbox
        self.anim_listbox = tk.Listbox(left_panel, bg='#0f0f1a', fg='#74b9ff',
                                       selectbackground='#ffdd57', selectforeground='#000',
                                       font=('Arial', 11))
        self.anim_listbox.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        self.anim_listbox.bind('<<ListboxSelect>>', self.on_select_anim)

        # Rescan button
        tk.Button(left_panel, text="Rescan", bg='#0984e3', fg='#fff',
                 font=('Arial', 10, 'bold'), width=10,
                 command=self.rescan_animations).pack(pady=10)

        # Right panel - preview and controls
        right_panel = tk.Frame(main_frame, bg='#16213e')
        right_panel.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        # Preview area
        preview_frame = tk.Frame(right_panel, bg='#0f0f1a')
        preview_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        self.canvas = tk.Canvas(preview_frame, bg='#0f0f1a', highlightthickness=0)
        self.canvas.pack(fill=tk.BOTH, expand=True)

        # Info label
        self.info_label = tk.Label(right_panel, text="Select an animation",
                                   bg='#16213e', fg='#888', font=('Arial', 10))
        self.info_label.pack(pady=5)

        # Controls
        controls_frame = tk.Frame(right_panel, bg='#16213e')
        controls_frame.pack(fill=tk.X, padx=10, pady=10)

        # Interval
        tk.Label(controls_frame, text="Interval(ms):", bg='#16213e', fg='#aaa').pack(side=tk.LEFT)
        self.interval_var = tk.IntVar(value=100)
        interval_scale = tk.Scale(controls_frame, from_=16, to=500, orient=tk.HORIZONTAL,
                                  variable=self.interval_var, bg='#16213e', fg='#ffdd57',
                                  highlightthickness=0, command=self.on_interval_change)
        interval_scale.pack(side=tk.LEFT, padx=10)

        # Scale
        tk.Label(controls_frame, text="Scale:", bg='#16213e', fg='#aaa').pack(side=tk.LEFT, padx=(20, 0))
        self.scale_var = tk.DoubleVar(value=1.0)
        scale_scale = tk.Scale(controls_frame, from_=0.5, to=4.0, resolution=0.1,
                               orient=tk.HORIZONTAL, variable=self.scale_var,
                               bg='#16213e', fg='#ffdd57', highlightthickness=0,
                               command=self.on_scale_change)
        scale_scale.pack(side=tk.LEFT, padx=10)

        # Buttons
        btn_frame = tk.Frame(right_panel, bg='#16213e')
        btn_frame.pack(fill=tk.X, padx=10, pady=5)

        self.play_btn = tk.Button(btn_frame, text="Play", bg='#00d084', fg='#fff',
                                  font=('Arial', 10, 'bold'), width=10,
                                  command=self.toggle_play)
        self.play_btn.pack(side=tk.LEFT, padx=5)

        tk.Button(btn_frame, text="Prev", bg='#555', fg='#fff',
                  width=8, command=self.prev_frame).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="Next", bg='#555', fg='#fff',
                  width=8, command=self.next_frame).pack(side=tk.LEFT, padx=5)

        # Path display
        self.path_label = tk.Label(right_panel, text="", bg='#16213e', fg='#666',
                                   font=('Arial', 9))
        self.path_label.pack(pady=5)

    def load_config(self):
        script_dir = Path(__file__).parent
        config_file = script_dir / 'frame_animator_config.json'
        data_file = script_dir / 'frame_animator_data.json'

        # Load config
        if config_file.exists():
            with open(config_file, 'r', encoding='utf-8') as f:
                config = json.load(f)
            # Support both basePath (single) and basePaths (multiple)
            if 'basePaths' in config:
                self.base_paths = config['basePaths']
            elif 'basePath' in config:
                self.base_paths = [config['basePath']]
            else:
                self.base_paths = ['./']
        else:
            self.base_paths = ['./']

        # Auto scan on first load
        self.scan_animations()

        # Save scanned data
        data = {'basePaths': self.base_paths, 'animations': self.animations}
        with open(data_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        # Update listbox
        self.anim_listbox.delete(0, tk.END)
        for anim in self.animations:
            self.anim_listbox.insert(tk.END, f"{anim['name']} ({len(anim['frames'])})")

        if self.animations:
            self.anim_listbox.select_set(0)
            self.on_select_anim(None)

    def scan_animations(self):
        script_dir = Path(__file__).parent
        self.animations = []

        for base_path in self.base_paths:
            base = (script_dir / base_path).resolve()
            if not base.exists():
                continue

            for root, dirs, files in os.walk(base):
                images = [f for f in files if Path(f).suffix.lower() in IMAGE_EXTS]
                if len(images) >= 2:
                    images.sort(key=natural_sort_key)
                    rel_path = Path(root).relative_to(base)
                    self.animations.append({
                        'name': Path(root).name,
                        'base': base_path,
                        'path': str(rel_path).replace('\\', '/'),
                        'frames': images
                    })
        self.animations.sort(key=lambda x: x['name'])

    def rescan_animations(self):
        """Rescan animations from disk and reload the list"""
        self.scan_animations()

        # Save scanned data
        script_dir = Path(__file__).parent
        data_file = script_dir / 'frame_animator_data.json'
        data = {'basePaths': self.base_paths, 'animations': self.animations}
        with open(data_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        # Update listbox
        self.anim_listbox.delete(0, tk.END)
        for anim in self.animations:
            self.anim_listbox.insert(tk.END, f"{anim['name']} ({len(anim['frames'])})")

        # Select first if available
        if self.animations:
            self.anim_listbox.select_set(0)
            self.on_select_anim(None)
        else:
            self.current_anim = None
            self.canvas.delete("all")
            self.info_label.config(text="No animations found")
            self.path_label.config(text="")

    def on_select_anim(self, event):
        sel = self.anim_listbox.curselection()
        if not sel:
            return
        idx = sel[0]
        self.current_anim = self.animations[idx]
        self.current_frame = 0
        self.playing = False
        self.play_btn.config(text="Play", bg='#00d084')
        self.path_label.config(text=f"{self.current_anim['base']}{self.current_anim['path']}")
        self.show_frame(0)

    def show_frame(self, frame_idx):
        if not self.current_anim:
            return

        self.current_frame = frame_idx % len(self.current_anim['frames'])
        frame_name = self.current_anim['frames'][self.current_frame]

        script_dir = Path(__file__).parent
        img_path = script_dir / self.current_anim['base'] / self.current_anim['path'] / frame_name

        try:
            img = Image.open(img_path)

            # Resize
            scale = self.scale_var.get()
            new_w = int(img.width * scale)
            new_h = int(img.height * scale)
            if scale != 1.0:
                img = img.resize((new_w, new_h), Image.LANCZOS)

            self.photo = ImageTk.PhotoImage(img)

            # Center in canvas
            self.canvas.delete("all")
            cw = self.canvas.winfo_width()
            ch = self.canvas.winfo_height()
            x = max(0, (cw - new_w) // 2)
            y = max(0, (ch - new_h) // 2)
            self.canvas.create_image(x, y, anchor=tk.NW, image=self.photo)

            self.info_label.config(
                text=f"Frame {self.current_frame + 1}/{len(self.current_anim['frames'])} - {frame_name}"
            )
        except Exception as e:
            self.info_label.config(text=f"Error: {e}")

    def toggle_play(self):
        if not self.current_anim:
            return

        self.playing = not self.playing
        if self.playing:
            self.play_btn.config(text="Stop", bg='#ff6b6b')
            self.play_loop()
        else:
            self.play_btn.config(text="Play", bg='#00d084')

    def play_loop(self):
        if not self.playing or not self.current_anim:
            return
        self.next_frame()
        self.root.after(self.interval_var.get(), self.play_loop)

    def next_frame(self):
        if self.current_anim:
            self.show_frame(self.current_frame + 1)

    def prev_frame(self):
        if self.current_anim:
            self.show_frame(self.current_frame - 1)

    def on_interval_change(self, val):
        pass

    def on_scale_change(self, val):
        if self.current_anim:
            self.show_frame(self.current_frame)

if __name__ == '__main__':
    root = tk.Tk()
    app = FrameAnimator(root)
    root.mainloop()
