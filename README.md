# Convertisseur de Carte de Pixels

Une application web légère qui convertit les images en cartes de pixels pour le point de croix et autres crafts.

## Fonctionnalités

- Convertit les images en cartes de pixels de 50x70
- Supporte 9 à 12 nuances de gris (par défaut 12)
- Interface utilisateur en français
- Affichage de l'image en pixels gris et de la carte de pixels
- Téléchargement de la carte de pixels au format PDF (2 pages)
- Impression directe de la carte de pixels
- API RESTful pour l'intégration backend

## Technologies

- HTML5, CSS3, JavaScript (ES6+)
- Node.js avec Express.js
- Vercel pour le déploiement

## Structure du Projet

```
pixel-map-converter/
├── public/                 # Fichiers statiques
│   ├── index.html         # Page principale
│   ├── styles.css         # Styles
│   └── script.js          # Logique frontend
├── api/                    # Endpoints API
│   └── convert.js         # Conversion d'images
├── utils/                  # Fonctions utilitaires
│   └── imageProcessor.js  # Traitement d'images
├── package.json           # Dépendances et scripts
└── vercel.json            # Configuration Vercel
```

## Utilisation

### Interface Web

1. Téléchargez une image en utilisant le bouton "Choisir un fichier" ou par glisser-déposer
2. Sélectionnez le nombre de nuances de gris souhaité (9-12)
3. Cliquez sur "Convertir en Carte de Pixels"
4. Affichez l'image en pixels gris et la carte de pixels
5. Téléchargez le fichier PDF (2 pages) ou imprimez directement

### API

L'API est accessible via `/api/convert`:

```bash
# Conversion d'image
curl -X POST http://localhost:3000/api/convert \
  -H "Content-Type: application/json" \
  -d '{
    "imageData": "base64-encoded-image-data",
    "shades": 12,
    "format": "json"
  }'
```

Formats supportés:
- `json` - Réponse JSON avec la carte de pixels
- `csv` - Fichier CSV avec la carte de pixels
- `pdf` - Fichier PDF avec l'image en pixels gris et la carte de pixels

## Déploiement

### Vercel

1. Connectez votre dépôt GitHub à Vercel
2. Vercel déploiera automatiquement l'application
3. Les endpoints API seront disponibles à `/api/*`

### Développement Local

```bash
# Installation
npm install

# Développement local avec Vercel
npm run dev

# L'application sera disponible à http://localhost:3000
```

## Extensibilité

Cette application est conçue pour être facilement extensible :

- Ajout de nouveaux formats de sortie
- Support d'autres dimensions de carte
- Intégration avec d'autres services
- Personnalisation des algorithmes de traitement

## Licence

MIT © 2025 Convertisseur de Carte de Pixels