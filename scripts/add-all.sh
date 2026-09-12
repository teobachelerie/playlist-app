#!/usr/bin/env bash
# Ajoute une série de titres d'un coup. Continue même si un titre échoue
# (vidéo indisponible, erreur réseau...) et donne un résumé à la fin.
#
# Usage : bash scripts/add-all.sh

set -uo pipefail

tracks=(
  "https://www.youtube.com/watch?v=SRXH9AbT280|Emptiness Machine|Linkin Park"
  "https://www.youtube.com/watch?v=FITSPSA8gQs|Never Be the Same|Camila Cabello"
  "https://www.youtube.com/watch?v=0GVExpdmoDs|Animals|Maroon 5"
  "https://www.youtube.com/watch?v=HKXoInMaVgs|Hell On Me|Johnny Huynh"
  "https://www.youtube.com/watch?v=CfihYWRWRTQ|Love Me Again|John Newman"
  "https://www.youtube.com/watch?v=FLDaac4_hMc|New Religion|Bebe Rexha & Faithless"
  "https://www.youtube.com/watch?v=K533gW3boIY|Me, Myself & I|G-Eazy x Bebe Rexha"
  "https://www.youtube.com/watch?v=XmIgg9De9hY|The Nights|Avicii"
  "https://www.youtube.com/watch?v=fH_OnJk6QqU|High Hopes|Panic! At the Disco"
  "https://www.youtube.com/watch?v=bPs0xFd4skY|Alone|Alan Walker"
  "https://www.youtube.com/watch?v=voM6aSZzcDk|Beautiful Mistakes|Maroon 5 & Megan Thee Stallion"
  "https://www.youtube.com/watch?v=9cQVGgiLMQo|This Girl|Kungs & Cookin' On 3 Burners"
  "https://www.youtube.com/watch?v=PFW2uSCZ0uE|Clocks|Coldplay"
  "https://www.youtube.com/watch?v=mbtnOjDitkY|Intro|Josman"
  "https://www.youtube.com/watch?v=2K9wxzFLye0|Him & I|G-Eazy & Halsey"
  "https://www.youtube.com/watch?v=-hzFTJDJGkQ|Love in the Dark|Adele"
  "https://www.youtube.com/watch?v=bn8gP5N8hqM|Cry For Me|The Weeknd"
  "https://www.youtube.com/watch?v=KkGVmN68ByU|Mercy|Shawn Mendes"
  "https://www.youtube.com/watch?v=rK6XC4_n1rY|I Run|HAVEN. & Kaitlin Aragon"
  "https://www.youtube.com/watch?v=SkcO47UDzzY|LET THE WORLD BURN|Chris Grey"
)

success=0
fail=0
failed_titles=()

for entry in "${tracks[@]}"; do
  IFS='|' read -r url title artist <<< "$entry"
  echo ""
  echo "→→→ $title — $artist"
  if npm run add-track -- "$url" "$title" "$artist"; then
    success=$((success + 1))
  else
    echo "✗ Échec pour : $title — $artist"
    fail=$((fail + 1))
    failed_titles+=("$title — $artist")
  fi
done

echo ""
echo "==================================="
echo "Terminé : $success ajoutés, $fail échecs."
if [ "$fail" -gt 0 ]; then
  echo "Titres en échec :"
  for t in "${failed_titles[@]}"; do
    echo "  - $t"
  done
fi
