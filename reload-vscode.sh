#!/bin/bash
# VS Code'u yeniden yüklemek için script

echo "🔄 VS Code'u yeniden yüklüyorum..."

# VS Code CLI varsa reload komutunu gönder
if command -v code >/dev/null 2>&1; then
    # VS Code'a reload komutu gönder
    osascript -e 'tell application "Visual Studio Code" to activate' 2>/dev/null || true
    osascript -e 'tell application "System Events" to keystroke "p" using {command down, shift down}' 2>/dev/null || true
    sleep 0.5
    osascript -e 'tell application "System Events" to keystroke "Developer: Reload Window" & return' 2>/dev/null || true
    echo "✅ VS Code reload komutu gönderildi"
else
    echo "⚠️  VS Code CLI bulunamadı"
    echo "Manuel olarak yapın:"
    echo "1. VS Code'da Cmd+Shift+P basın"
    echo "2. 'Developer: Reload Window' yazın"
    echo "3. Enter'a basın"
fi
