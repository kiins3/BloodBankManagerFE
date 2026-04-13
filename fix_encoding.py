import os
import glob

def fix_encoding(filepath):
    """
    Fix mojibake caused by PowerShell reading UTF-8 as Windows-1252 then re-saving as UTF-8.
    The fix: read garbled UTF-8 -> encode back to latin-1 to recover original bytes -> decode as UTF-8.
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        try:
            fixed = content.encode('latin-1').decode('utf-8')
            # Only write if content actually changed
            if fixed != content:
                with open(filepath, 'w', encoding='utf-8', newline='\r\n') as f:
                    f.write(fixed)
                print(f"[FIXED] {filepath}")
            else:
                print(f"[OK]    {filepath}")
        except (UnicodeEncodeError, UnicodeDecodeError):
            print(f"[SKIP]  {filepath} (not double-encoded, already correct)")
    except Exception as e:
        print(f"[ERR]   {filepath}: {e}")

base = r"e:\DATN\DATN_2_Blood\Blood_Bank\FE"
targets = [
    os.path.join(base, "admin_view", "*.html"),
    os.path.join(base, "staff_view", "*.html"),
]

for pattern in targets:
    for filepath in sorted(glob.glob(pattern)):
        fix_encoding(filepath)

print("\nDone!")
