#!/usr/bin/env bash
# Ajoute d'un coup les titres de ta bibliothèque Apple Music (108 titres),
# en laissant yt-dlp chercher lui-même sur YouTube à partir du titre+artiste
# (pas besoin de fournir un lien). Continue même si un titre échoue, résumé
# à la fin.
#
# Usage : bash scripts/add-library.sh

set -uo pipefail

tracks=(
  "Je suis Marseille (feat. SCH, Akhenaton, JUL, L'Algérino, Alonzo, Shurik'n, Fahar, Le Rat Luciano)|13 Organisé"
  "I'm a Believer|Smash Mouth"
  "Dragon Screamer|DA PUMP"
  "Me Gustas Tu|Manu Chao"
  "Viva La Vida|Coldplay"
  "All Star|Smash Mouth"
  "Don't Worry (feat. Ray Dalton)|Madcon"
  "Chaussures Roses|TeddyBear"
  "Counting Stars|Planet Wave House, MYKA & Kelo"
  "Save Me Tonight|Jennifer Lopez & David Guetta"
  "Another Love|Tom Odell"
  "Lifesaver|CG5"
  "Sunrise|CG5"
  "Entranced|CG5"
  "Feel Good Inc|Gorillaz"
  "House of Memories|Panic! At the Disco"
  "Take Me Out|Franz Ferdinand"
  "Jerk It Out|Caesars"
  "Mary On A Cross|Ghost"
  "DARE (feat. Shaun Ryder & Rosie Wilson)|Gorillaz"
  "Free Bird|Lynyrd Skynyrd"
  "Money For Nothing (Remastered)|Dire Straits"
  "505|Arctic Monkeys"
  "Take Me To Church|Hozier"
  "Shofukan|Snarky Puppy"
  "next to you|JVKE"
  "Petit frere|IAM"
  "Les cornichons|Nino Ferrer"
  "Children of the Machine|CG5 & Dagames"
  "I WANNA BE YOUR SLAVE|Maneskin"
  "Believer|Imagine Dragons"
  "Marche slave, Op. 31, TH 45|Tchaikovsky"
  "Seven Nation Army|The White Stripes"
  "Can You Feel My Heart|Bring Me The Horizon"
  "U MOVE|CG5"
  "A Little Change|CG5"
  "Papercut|Linkin Park"
  "Numb|Linkin Park"
  "The Syndrome|Grey Daze"
  "Killer Queen|Queen"
  "Sparkle (From Your Name)|Theishter"
  "More the Victim|Linkin Park"
  "Sickness|Grey Daze"
  "Halo|Always Mirin"
  "Killing In The Name|Rage Against the Machine"
  "L'empire du cote obscur|IAM"
  "BAILE INoLVIDABLE|Bad Bunny"
  "Tabun|YOASOBI"
  "CHRISTmas|JVKE & Forrest Frank"
  "Healing Foot|Linkin Park"
  "Faint|Linkin Park"
  "this is what space feels like|JVKE"
  "this is what autumn feels like|JVKE"
  "Sometimes|Grey Daze"
  "What's In The Eye|Grey Daze"
  "Somewhere I Belong|Linkin Park"
  "Hold On|Limp Bizkit"
  "Satellite|P.O.D."
  "Can-Can|Jacques Offenbach"
  "End of Beginning|Djo"
  "Euphoria|Muse"
  "Canon in D|Brooklyn Duo"
  "oh to be loved|JVKE"
  "Royalty|Egzod, Maestro Chives & Neoni"
  "On The Floor (Hardstyle)|crypvolk"
  "Oh He Hein Bon|Nino Ferrer"
  "Je veux etre noir|Nino Ferrer"
  "Pandi Panda|Chantal Goya"
  "Resistance|Muse"
  "Nightmare|Avenged Sevenfold"
  "Too Cool To Be Careless|PAWSA"
  "Counting Stars|OneRepublic"
  "Danza Kuduro (Tiesto Remix)|Don Omar, Lucenzo & Tiesto"
  "Gangnam Style|PSY"
  "Turn the Lights Off (Radio Edit)|KATO & Jon"
  "golden hour|JVKE"
  "Daylight|David Kushner"
  "Wait|Earshot"
  "Breaking the Habit|Linkin Park"
  "The One|Limp Bizkit"
  "In the End|Linkin Park"
  "Even Flow|Pearl Jam"
  "Re-Arranged|Limp Bizkit"
  "Dedicated 1999 Demo|Linkin Park"
  "Lollipop Porn|Crazy Town"
  "catch me|JVKE"
  "The Internationale Russian Version|USSR Soviet Chorus"
  "Give a Little|LeGrand & CG5"
  "Alone Pt 2|Alan Walker & Ava Max"
)

success=0
fail=0
failed_titles=()

for entry in "${tracks[@]}"; do
  IFS='|' read -r title artist <<< "$entry"
  echo ""
  echo "→→→ $title — $artist"
  if npm run add-track -- "$title $artist" "$title" "$artist"; then
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
