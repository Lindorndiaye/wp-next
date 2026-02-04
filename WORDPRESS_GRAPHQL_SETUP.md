# Configuration WordPress GraphQL avec Pods

Ce document explique comment configurer votre projet pour utiliser WordPress GraphQL avec Pods au lieu de l'API REST.

## Prérequis

1. WordPress installé avec les plugins suivants :
   - **WPGraphQL** (https://www.wpgraphql.com/)
   - **WPGraphQL for Pods** (extension pour exposer les champs Pods dans GraphQL)
   - **Pods** (https://pods.io/)

## Configuration

### 1. Variables d'environnement

Créez un fichier `.env.local` à la racine du projet avec :

```env
# URL de votre site WordPress
WORDPRESS_URL=https://votre-site-wordpress.com

# Activer GraphQL (par défaut: true)
# Mettez à 'false' pour utiliser l'API REST
USE_WORDPRESS_GRAPHQL=true
```

### 2. Configuration WPGraphQL

Dans votre WordPress :
1. Allez dans **GraphQL > Settings**
2. Activez les types de contenu que vous souhaitez exposer (Posts, et votre Custom Post Type pour les projets)
3. Configurez les permissions si nécessaire

### 3. Configuration Pods pour GraphQL

Pour que vos champs Pods soient accessibles via GraphQL :

1. Dans **Pods > Edit Pods**, éditez votre Pod
2. Pour chaque champ que vous voulez exposer :
   - Allez dans les options du champ
   - Activez **"Expose in GraphQL"**
   - Définissez le nom du champ GraphQL (généralement le même que le nom du champ)

### 4. Adapter les requêtes GraphQL

Les requêtes GraphQL dans `src/utils/wordpress.ts` doivent être adaptées selon votre structure Pods.

#### Pour les Posts

Les champs Pods peuvent être accessibles de deux façons :
- Directement sur le post : `tag`, `summary`, `images`, etc.
- Via le champ `pods` : `pods { tag, summary, images }`

Modifiez la requête `GET_POSTS_QUERY` dans `wordpress.ts` selon votre configuration.

#### Pour les Projets (Custom Post Type)

**Important** : Le nom du Custom Post Type dans GraphQL peut varier. Options courantes :
- `projets` (pluriel)
- `projet` (singulier)
- `projects` (anglais)

Dans `src/utils/wordpress.ts`, modifiez les requêtes suivantes :
- `GET_PROJECTS_QUERY` : Changez `projets` par le nom de votre CPT
- `GET_PROJECT_BY_SLUG_QUERY` : Changez `projetBy` par `[votre-cpt]By`

Exemple si votre CPT s'appelle "project" :
```graphql
query GetProjects {
  projects(first: 100, where: { status: PUBLISH }) {
    nodes {
      # ...
    }
  }
}
```

### 5. Structure des champs Pods

Assurez-vous que vos champs Pods correspondent à ce qui est attendu :

#### Pour les Posts :
- `tag` : Texte simple
- `summary` : Texte simple ou Textarea
- `image` : URL d'image
- `images` : Textarea avec URLs séparées par `\n` ou champ répétable
- `team` : Textarea avec JSON ou champ répétable
- `link` : URL

#### Pour les Projets :
- `summary` : Texte simple ou Textarea
- `images` : Textarea avec URLs séparées par `\n` ou champ répétable
- `team` : Textarea avec JSON ou champ répétable
- `link` : URL
- `description` : WYSIWYG Editor (contenu long)

### 6. Format JSON pour l'équipe

Le champ `team` doit être au format JSON si c'est un Textarea :

```json
[
  {
    "name": "John Doe",
    "role": "Développeur",
    "avatar": "https://example.com/avatar.jpg",
    "linkedIn": "https://linkedin.com/in/johndoe"
  }
]
```

### 7. Test de la configuration

1. Vérifiez que votre endpoint GraphQL est accessible :
   ```
   https://votre-site-wordpress.com/graphql
   ```

2. Testez une requête simple dans GraphQL Playground ou un outil similaire :
   ```graphql
   query {
     posts(first: 1) {
       nodes {
         title
         slug
       }
     }
   }
   ```

3. Vérifiez que vos champs Pods sont bien exposés :
   ```graphql
   query {
     posts(first: 1) {
       nodes {
         title
         pods {
           tag
           summary
         }
       }
     }
   }
   ```

### 8. Dépannage

#### Erreur : "Cannot query field 'projets'"
- Vérifiez le nom exact de votre Custom Post Type dans GraphQL
- Allez dans GraphQL > Settings et vérifiez que votre CPT est activé

#### Les champs Pods ne s'affichent pas
- Vérifiez que "Expose in GraphQL" est activé pour chaque champ dans Pods
- Vérifiez que WPGraphQL for Pods est installé et activé
- Vérifiez le nom des champs dans la requête GraphQL

#### Fallback sur REST API
- Si GraphQL échoue, le système basculera automatiquement sur REST API
- Vérifiez les logs de la console pour voir les erreurs

### 9. Désactiver GraphQL

Si vous voulez revenir à l'API REST, mettez dans `.env.local` :
```env
USE_WORDPRESS_GRAPHQL=false
```

## Support

Pour plus d'informations :
- [Documentation WPGraphQL](https://www.wpgraphql.com/docs/)
- [Documentation Pods](https://docs.pods.io/)
- [WPGraphQL for Pods](https://github.com/pods-framework/pods-graphql)
