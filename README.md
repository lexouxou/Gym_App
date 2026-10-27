# ⚡ IronTrack - Suivi de Musculation Minimaliste (MVP)

Une application web ultra rapide, sans fioritures ni usine à gaz, conçue spécifiquement pour être utilisée sur smartphone entre deux séries à la salle de sport.

![IronTrack Preview](https://img.shields.io/badge/Stack-HTML5%20%2F%20TailwindCSS%20%2F%20Vanilla%20JS-3b82f6)
![Mode](https://img.shields.io/badge/Offline-100%25%20Local-emerald-500)
![PWA](https://img.shields.io/badge/PWA-Installable-blueviolet)

---

## 🎯 Fonctionnalités clés

- 📱 **Mobile-First & Clean Dark Mode** : Interface optimisée pour une utilisation à une main avec gros boutons tactiles (`+` / `-`).
- ⚡ **Saisie ultra rapide** :
  - Bouton *"Reprendre dernière séance"* pour pré-remplir instantanément tes charges habituelles.
  - Ajustement en 1 tap avec les boutons steppers (+1kg / +2.5kg / +reps).
- 📈 **Indicateur de surcharge progressive immédiat** :
  - Badge vert lumineux automatique (`+2 kg 🔥` ou `+2 reps 🚀`) dès que tu bats ta séance précédente, ou indication de maintien. Évite l'effet "je stagne" d'un coup d'œil !
- 📋 **Exercices par défaut intégrés** :
  - **Échauffement intelligent** : Gainage (2 min - verrouillage du tronc), Banc à lombaires (3 × 15 reps - chaîne postérieure).
  - **Tirage (Dos)** : Lat pulldown en pyramide (25 -> 30 -> 35 kg), Low rows (35 kg).
  - **Poussées (Buste & Épaules)** : Chest Press (35 kg), Shoulder Press (10 -> 15 kg), Élévations latérales (4 kg).
  - **Bras & Abdos (Isolation)** : Curl biceps (8 kg), Curl inversé (4 kg), Machine crunches (25 kg).
  - Ajout d'exercices personnalisés à la volée.
- ⏱️ **Chronomètre de repos intégré** : 60s, 90s, 120s avec alerte sonore (bip) quand c'est l'heure de repartir.
- 📅 **Historique clair & Filtres** : Consulte tes séances passées ou isole un exercice pour voir ta courbe de progression dans le temps.
- 🔒 **100% Hors-Ligne & Privé** : Données enregistrées dans le `localStorage` de ton navigateur (aucun compte requis, marche même au sous-sol sans réseau).
- 💾 **Export / Import JSON** : Sauvegarde ou restaure tes données en 1 clic.

---

## 🚀 Comment l'utiliser directement

### Option 1 : Déploiement en ligne gratuit sur GitHub Pages (Recommandé pour l'avoir sur ton smartphone)

1. Pousse le code sur ton dépôt GitHub :
   ```bash
   git add .
   git commit -m "feat: initialisation IronTrack MVP"
   git branch -M main
   git push -u origin main
   ```
2. Va sur ton dépôt GitHub : **Settings** > **Pages**.
3. Dans **Build and deployment** > **Source**, choisis **Deploy from a branch**, branche `main`, dossier `/ (root)`.
4. Clique sur **Save**. En 1 minute, ton app est en ligne à l'adresse :
   `https://lexouxou.github.io/Gym_App/`
5. Ouvre cette URL sur ton téléphone (Safari sur iOS ou Chrome sur Android) et clique sur **"Ajouter à l'écran d'accueil"**. L'app s'ouvrira en plein écran comme une vraie application native !

### Option 2 : Lancement local sur ta machine

Ouvre simplement le fichier `index.html` dans ton navigateur, ou lance un petit serveur local :
```bash
python3 -m http.server 8080
# ou npx serve
```
Puis accède à `http://localhost:8080`.
