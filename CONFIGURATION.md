# Configuration pour pods.lindor.dev

## ✅ Étape 1 : Créer le fichier .env.local

Créez un fichier `.env.local` à la racine du projet avec :

```env
WORDPRESS_URL=https://pods.lindor.dev
USE_WORDPRESS_GRAPHQL=true
```

## ✅ Étape 2 : Tester la connexion GraphQL

Le endpoint GraphQL est accessible et fonctionne ! ✅

Vous pouvez tester avec :

```bash
curl -X POST https://pods.lindor.dev/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ posts(first: 1) { nodes { title slug } } }"}'
```

## 🔧 Étape 3 : Adapter les requêtes GraphQL

### Pour trouver vos Custom Post Types

1. Allez sur https://pods.lindor.dev/wp-admin
2. GraphQL > Settings
3. Vérifiez quels Custom Post Types sont activés
4. Ou testez directement dans GraphQL Playground : https://pods.lindor.dev/graphql

### Modifier les requêtes dans `src/utils/wordpress.ts`

#### Pour les projets (ligne ~696) :

Si votre Custom Post Type s'appelle différemment de "projets", changez :

```graphql
# Avant
projets(first: 100, where: { status: PUBLISH }) {

# Après (exemple si c'est "project")
projects(first: 100, where: { status: PUBLISH }) {
```

#### Pour les projets par slug (ligne ~740) :

Changez le nom de la requête :

```graphql
# Avant
projetBy(slug: $slug) {

# Après (exemple si c'est "project")
projectBy(slug: $slug) {
```

### Configurer les champs Pods

Les champs Pods peuvent être accessibles de deux façons :

#### Option 1 : Directement sur le post/projet

Si vos champs Pods sont exposés directement, décommentez dans les requêtes :

```graphql
# Décommentez ces lignes dans GET_POSTS_QUERY et GET_POST_BY_SLUG_QUERY
tag
summary
image
images
team
```

#### Option 2 : Via le champ `pods`

Si vos champs sont dans `pods`, gardez tel quel (déjà configuré) :

```graphql
pods {
  tag
  summary
  image
  images
  team
  link
}
```

## 🧪 Tester votre configuration

1. Redémarrez le serveur de développement :
   ```bash
   npm run dev
   ```

2. Visitez http://localhost:3000/blog pour voir les posts

3. Vérifiez la console pour les erreurs éventuelles

## 📝 Notes importantes

- Si GraphQL échoue, le système basculera automatiquement sur REST API
- Les erreurs sont loggées dans la console
- Vérifiez que WPGraphQL for Pods est installé et activé dans WordPress
- Assurez-vous que les champs Pods sont bien exposés dans GraphQL (Pods > Edit Pod > Field Options > "Expose in GraphQL")

## 🆘 Dépannage

### Erreur : "Cannot query field 'projets'"
→ Vérifiez le nom exact de votre Custom Post Type et modifiez les requêtes

### Les champs Pods ne s'affichent pas
→ Vérifiez que "Expose in GraphQL" est activé pour chaque champ dans Pods

### Fallback sur REST API
→ Vérifiez les logs de la console pour voir l'erreur GraphQL exacte
