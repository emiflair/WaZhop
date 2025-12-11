#!/usr/bin/env python3
"""
Generate iOS-style splash screens for PWA
Based on iOS implementation with orange background and white W logo
"""

from PIL import Image, ImageDraw
import os

# iOS splash screen sizes for different devices
SPLASH_SIZES = [
    # iPhone SE, 8, 7, 6s, 6
    (750, 1334, "iphone-se"),
    (1334, 750, "iphone-se-landscape"),
    
    # iPhone 8 Plus, 7 Plus, 6s Plus, 6 Plus
    (1242, 2208, "iphone-plus"),
    (2208, 1242, "iphone-plus-landscape"),
    
    # iPhone X, XS, 11 Pro, 12 mini, 13 mini
    (1125, 2436, "iphone-x"),
    (2436, 1125, "iphone-x-landscape"),
    
    # iPhone XR, 11, 12, 13, 14
    (828, 1792, "iphone-xr"),
    (1792, 828, "iphone-xr-landscape"),
    
    # iPhone XS Max, 11 Pro Max, 12 Pro Max, 13 Pro Max, 14 Plus
    (1242, 2688, "iphone-xs-max"),
    (2688, 1242, "iphone-xs-max-landscape"),
    
    # iPhone 14 Pro, 15, 15 Pro
    (1179, 2556, "iphone-14-pro"),
    (2556, 1179, "iphone-14-pro-landscape"),
    
    # iPhone 14 Pro Max, 15 Plus, 15 Pro Max
    (1290, 2796, "iphone-14-pro-max"),
    (2796, 1290, "iphone-14-pro-max-landscape"),
    
    # iPad Mini, Air (portrait)
    (1536, 2048, "ipad"),
    (2048, 1536, "ipad-landscape"),
    
    # iPad Pro 10.5"
    (1668, 2224, "ipad-pro-10"),
    (2224, 1668, "ipad-pro-10-landscape"),
    
    # iPad Pro 11"
    (1668, 2388, "ipad-pro-11"),
    (2388, 1668, "ipad-pro-11-landscape"),
    
    # iPad Pro 12.9"
    (2048, 2732, "ipad-pro-12"),
    (2732, 2048, "ipad-pro-12-landscape"),
]

# Orange background color (WaZhop brand)
ORANGE_COLOR = "#F97316"

def create_splash_screen(width, height, output_path, logo_path):
    """Create a splash screen with orange background and white logo"""
    # Create image with orange background
    img = Image.new('RGB', (width, height), ORANGE_COLOR)
    
    # Load and resize logo
    logo = Image.open(logo_path).convert('RGBA')
    
    # Calculate logo size (approximately 25% of screen width)
    logo_width = int(width * 0.25)
    logo_height = int(logo_width * logo.height / logo.width)
    logo = logo.resize((logo_width, logo_height), Image.Resampling.LANCZOS)
    
    # Center the logo
    x = (width - logo_width) // 2
    y = (height - logo_height) // 2
    
    # Paste logo with transparency
    img.paste(logo, (x, y), logo)
    
    # Convert to RGB and save
    img = img.convert('RGB')
    img.save(output_path, 'PNG', optimize=True)
    print(f"✓ Generated: {os.path.basename(output_path)} ({width}x{height})")

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    client_dir = os.path.dirname(script_dir)
    
    # Source logo with white W on transparent background
    logo_path = os.path.join(client_dir, 'public', 'apple-touch-icon.png')
    
    # Output directory for splash screens
    splash_dir = os.path.join(client_dir, 'public', 'splash')
    os.makedirs(splash_dir, exist_ok=True)
    
    if not os.path.exists(logo_path):
        print(f"❌ Logo not found: {logo_path}")
        return
    
    print("Generating iOS-style PWA splash screens...")
    print(f"Using logo: {logo_path}")
    print(f"Output directory: {splash_dir}")
    print()
    
    total_size = 0
    for width, height, name in SPLASH_SIZES:
        output_path = os.path.join(splash_dir, f"splash-{name}.png")
        create_splash_screen(width, height, output_path, logo_path)
        total_size += os.path.getsize(output_path)
    
    print()
    print(f"✅ Generated {len(SPLASH_SIZES)} splash screens")
    print(f"📦 Total size: {total_size / 1024 / 1024:.2f} MB")
    print(f"📁 Location: {splash_dir}")

if __name__ == '__main__':
    main()
