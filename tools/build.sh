#!/bin/sh
# 配信用の zip を作る（itch.io などのブラウザ配信向け）
#   sh tools/build.sh   → dist/chousho-web.zip
# 遊ぶのに必要なものだけを入れる（開発用の tools・docs・試作版は入れない）
set -e
cd "$(dirname "$0")/.."
rm -rf dist && mkdir -p dist/web
cp index.html dist/web/
cp -r js css fonts dist/web/
mkdir -p dist/web/audio && cp audio/*.mp3 dist/web/audio/   # 元の音源（audio/src）は入れない
[ -f README.md ] && cp README.md dist/web/ || true
cd dist/web && zip -qr ../chousho-web.zip . && cd ../..
echo "dist/chousho-web.zip を作成：$(du -h dist/chousho-web.zip | cut -f1)"
