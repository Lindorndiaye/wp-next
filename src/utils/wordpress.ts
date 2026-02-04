import { GraphQLClient } from 'graphql-request';

type Team = {
  name: string;
  role: string;
  avatar: string;
  linkedIn: string;
};

/**
 * Décode les entités HTML en caractères normaux
 * Fonctionne côté serveur et client
 */
function decodeHTMLEntities(text: string): string {
  if (!text) return text;
  
  // Dictionnaire des entités HTML courantes
  const entities: { [key: string]: string } = {
    'rsquo': "'",
    'lsquo': "'",
    'rdquo': '"',
    'ldquo': '"',
    'apos': "'",
    'quot': '"',
    'amp': '&',
    'lt': '<',
    'gt': '>',
    'nbsp': ' ',
    'mdash': '—',
    'ndash': '–',
  };
  
  // Décoder les entités nommées (&rsquo;, &amp;, etc.)
  let decoded = text.replace(/&([a-zA-Z]+);/g, (match, entity) => {
    return entities[entity.toLowerCase()] || match;
  });
  
  // Décoder les entités numériques décimales (&#8217;, &#39;, etc.)
  decoded = decoded.replace(/&#(\d+);/g, (match, code) => {
    const charCode = parseInt(code, 10);
    // Gérer les caractères spéciaux courants
    if (charCode === 8217 || charCode === 8216 || charCode === 39) return "'";
    if (charCode === 8220 || charCode === 8221) return '"';
    if (charCode === 160) return ' '; // Non-breaking space
    return String.fromCharCode(charCode);
  });
  
  // Décoder les entités numériques hexadécimales (&#x2019;, &#x27;, etc.)
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (match, code) => {
    const charCode = parseInt(code, 16);
    // Gérer les caractères spéciaux courants
    if (charCode === 0x2019 || charCode === 0x2018 || charCode === 0x27) return "'";
    if (charCode === 0x201C || charCode === 0x201D) return '"';
    if (charCode === 0xA0) return ' '; // Non-breaking space
    return String.fromCharCode(charCode);
  });
  
  return decoded;
}

export type PostMetadata = {
  title: string;
  publishedAt: string;
  summary: string;
  image?: string;
  images: string[];
  tag?: string;
  team: Team[];
  link?: string;
};

export type Post = {
  metadata: PostMetadata;
  slug: string;
  content: string;
  id?: number; // ID WordPress du post
};

// WordPress REST API response types
type WordPressPost = {
  id: number;
  date: string;
  date_gmt: string;
  modified: string;
  modified_gmt: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
    protected: boolean;
  };
  excerpt: {
    rendered: string;
    protected: boolean;
  };
  featured_media: number;
  featured_media_url?: string;
  categories?: number[];
  tags?: number[];
  acf?: {
    tag?: string;
    image?: string;
    images?: string[];
    team?: Team[];
    summary?: string;
  };
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url: string;
      media_details?: {
        sizes?: {
          large?: { source_url: string };
          medium_large?: { source_url: string };
          full?: { source_url: string };
        };
      };
    }>;
  };
};

/**
 * Récupère tous les articles depuis WordPress
 * Utilise GraphQL par défaut, avec fallback sur REST API
 */
export async function getWordPressPosts(): Promise<Post[]> {
  // Utiliser GraphQL si disponible
  const useGraphQL = process.env.USE_WORDPRESS_GRAPHQL !== 'false';

  if (useGraphQL) {
    try {
      return await getWordPressPostsGraphQL();
    } catch (error) {
      console.warn("Erreur GraphQL, tentative avec REST API:", error);
      // Fallback sur REST API en cas d'erreur
    }
  }

  // Fallback: REST API (ancienne méthode)
  const wordpressUrl = process.env.WORDPRESS_URL;
  
  if (!wordpressUrl) {
    console.warn("WORDPRESS_URL n'est pas défini dans les variables d'environnement");
    return [];
  }

  try {
    // Construire l'URL de l'API WordPress
    const apiUrl = `${wordpressUrl}/wp-json/wp/v2/posts?per_page=100&_embed=true&status=publish`;
    
    const response = await fetch(apiUrl, {
      next: { revalidate: 60 }, // Cache pendant 1 minute pour refléter les changements rapidement
    });

    if (!response.ok) {
      throw new Error(`Erreur WordPress API: ${response.status} ${response.statusText}`);
    }

    const posts: WordPressPost[] = await response.json();

    return posts.map(transformWordPressPost);
  } catch (error) {
    console.error("Erreur lors de la récupération des articles WordPress:", error);
    return [];
  }
}

/**
 * Récupère un article spécifique par son slug
 * Utilise GraphQL par défaut, avec fallback sur REST API
 */
export async function getWordPressPostBySlug(slug: string): Promise<Post | null> {
  // Utiliser GraphQL si disponible
  const useGraphQL = process.env.USE_WORDPRESS_GRAPHQL !== 'false';

  if (useGraphQL) {
    try {
      return await getWordPressPostBySlugGraphQL(slug);
    } catch (error) {
      console.warn(`Erreur GraphQL pour ${slug}, tentative avec REST API:`, error);
      // Fallback sur REST API en cas d'erreur
    }
  }

  // Fallback: REST API (ancienne méthode)
  const wordpressUrl = process.env.WORDPRESS_URL;
  
  if (!wordpressUrl) {
    console.warn("WORDPRESS_URL n'est pas défini dans les variables d'environnement");
    return null;
  }

  try {
    const apiUrl = `${wordpressUrl}/wp-json/wp/v2/posts?slug=${slug}&_embed=true&status=publish`;
    
    const response = await fetch(apiUrl, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`Erreur WordPress API: ${response.status} ${response.statusText}`);
    }

    const posts: WordPressPost[] = await response.json();

    if (posts.length === 0) {
      return null;
    }

    return transformWordPressPost(posts[0]);
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'article ${slug}:`, error);
    return null;
  }
}

/**
 * Transforme un article WordPress en format compatible avec l'application
 */
function transformWordPressPost(wpPost: WordPressPost): Post {
  // Extraire l'image featured
  let featuredImage = "";
  if (wpPost._embedded?.["wp:featuredmedia"]?.[0]) {
    const media = wpPost._embedded["wp:featuredmedia"][0];
    featuredImage =
      media.media_details?.sizes?.large?.source_url ||
      media.media_details?.sizes?.medium_large?.source_url ||
      media.source_url;
  }

  // Extraire le résumé (excerpt) en texte brut
  const excerpt = wpPost.excerpt.rendered
    .replace(/<[^>]*>/g, "")
    .replace(/&[^;]+;/g, " ")
    .trim();

  // Extraire les métadonnées personnalisées depuis ACF si disponible
  const acf = wpPost.acf || {};

  return {
    slug: wpPost.slug,
    metadata: {
      title: decodeHTMLEntities(wpPost.title.rendered),
      publishedAt: wpPost.date,
      summary: excerpt || acf.summary || "",
      image: featuredImage || acf.image || "",
      images: acf.images || [],
      tag: acf.tag || "",
      team: acf.team || [],
      link: wpPost.link,
    },
    content: wpPost.content.rendered,
  };
}

// Types pour les projets WordPress
export type ProjectMetadata = {
  title: string;
  publishedAt: string;
  summary: string;
  image?: string;
  images: string[];
  team: Team[];
  link?: string;
  client?: string;
};

export type Project = {
  metadata: ProjectMetadata;
  slug: string;
  content: string;
};

type WordPressProject = {
  id: number;
  date: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
    protected: boolean;
  };
  featured_media: number;
  acf?: {
    summary?: string;
    images?: string; // Textarea avec URLs séparées par \n
    link?: string;
    team?: string; // Textarea avec JSON
    description?: string; // WYSIWYG Editor - Description longue
  };
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url: string;
      media_details?: {
        sizes?: {
          large?: { source_url: string };
          medium_large?: { source_url: string };
          full?: { source_url: string };
        };
      };
    }>;
  };
};

/**
 * Récupère tous les projets depuis WordPress
 * Utilise GraphQL par défaut, avec fallback sur REST API
 */
export async function getWordPressProjects(): Promise<Project[]> {
  // Utiliser GraphQL si disponible
  const useGraphQL = process.env.USE_WORDPRESS_GRAPHQL !== 'false';

  if (useGraphQL) {
    try {
      return await getWordPressProjectsGraphQL();
    } catch (error) {
      console.warn("Erreur GraphQL, tentative avec REST API:", error);
      // Fallback sur REST API en cas d'erreur
    }
  }

  // Fallback: REST API (ancienne méthode)
  const wordpressUrl = process.env.WORDPRESS_URL;
  
  if (!wordpressUrl) {
    console.warn("WORDPRESS_URL n'est pas défini dans les variables d'environnement");
    return [];
  }

  try {
    // Utiliser "projet" comme type de post (pas "project")
    const apiUrl = `${wordpressUrl}/wp-json/wp/v2/projet?per_page=100&_embed=true&status=publish`;
    
    const response = await fetch(apiUrl, {
      next: { revalidate: 60 }, // Cache pendant 1 minute pour refléter les changements rapidement
    });

    if (!response.ok) {
      throw new Error(`Erreur WordPress API: ${response.status} ${response.statusText}`);
    }

    const projects: WordPressProject[] = await response.json();

    return projects.map(transformWordPressProject);
  } catch (error) {
    console.error("Erreur lors de la récupération des projets WordPress:", error);
    return [];
  }
}

/**
 * Récupère un projet spécifique par son slug
 * Utilise GraphQL par défaut, avec fallback sur REST API
 */
export async function getWordPressProjectBySlug(slug: string): Promise<Project | null> {
  // Utiliser GraphQL si disponible
  const useGraphQL = process.env.USE_WORDPRESS_GRAPHQL !== 'false';

  if (useGraphQL) {
    try {
      return await getWordPressProjectBySlugGraphQL(slug);
    } catch (error) {
      console.warn(`Erreur GraphQL pour ${slug}, tentative avec REST API:`, error);
      // Fallback sur REST API en cas d'erreur
    }
  }

  // Fallback: REST API (ancienne méthode)
  const wordpressUrl = process.env.WORDPRESS_URL;
  
  if (!wordpressUrl) {
    console.warn("WORDPRESS_URL n'est pas défini dans les variables d'environnement");
    return null;
  }

  try {
    const apiUrl = `${wordpressUrl}/wp-json/wp/v2/projet?slug=${slug}&_embed=true&status=publish`;
    
    const response = await fetch(apiUrl, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`Erreur WordPress API: ${response.status} ${response.statusText}`);
    }

    const projects: WordPressProject[] = await response.json();

    if (projects.length === 0) {
      return null;
    }

    return transformWordPressProject(projects[0]);
  } catch (error) {
    console.error(`Erreur lors de la récupération du projet ${slug}:`, error);
    return null;
  }
}

/**
 * Transforme un projet WordPress en format compatible avec l'application
 */
function transformWordPressProject(wpProject: WordPressProject): Project {
  // Extraire l'image featured
  let featuredImage = "";
  if (wpProject._embedded?.["wp:featuredmedia"]?.[0]) {
    const media = wpProject._embedded["wp:featuredmedia"][0];
    featuredImage =
      media.media_details?.sizes?.large?.source_url ||
      media.media_details?.sizes?.medium_large?.source_url ||
      media.source_url;
  }

  // Extraire les métadonnées ACF
  // ACF peut être un tableau vide [] ou un objet {}
  let acf: any = {};
  if (wpProject.acf) {
    if (Array.isArray(wpProject.acf)) {
      // Si ACF est un tableau vide, c'est que les champs ne sont pas exposés
      acf = {};
    } else {
      acf = wpProject.acf;
    }
  }

  // Parser le Textarea "images" (URLs séparées par retours à la ligne)
  let images: string[] = [];
  if (acf.images && typeof acf.images === 'string') {
    images = acf.images
      .split('\n')
      .map((url: string) => url.trim())
      .filter((url: string) => url.length > 0);
  }
  
  // Si pas d'images dans ACF mais une image featured, l'utiliser
  if (images.length === 0 && featuredImage) {
    images = [featuredImage];
  }

  // Parser le Textarea "team" (JSON)
  let team: Team[] = [];
  if (acf.team && typeof acf.team === 'string') {
    try {
      const parsedTeam = JSON.parse(acf.team);
      if (Array.isArray(parsedTeam)) {
        team = parsedTeam;
      }
    } catch (e) {
      console.warn(`⚠️ Erreur lors du parsing du JSON team pour le projet ${wpProject.slug}:`, e);
      team = [];
    }
  }

  // Utiliser le résumé ACF ou un résumé par défaut
  const summary = acf.summary || "";

  const content = wpProject.content.rendered || "";
  
  // Utiliser la description ACF (WYSIWYG) si disponible, sinon utiliser le contenu WordPress
  const description = acf.description || content;

  return {
    slug: wpProject.slug,
    metadata: {
      title: decodeHTMLEntities(wpProject.title.rendered),
      publishedAt: wpProject.date,
      summary: summary,
      image: featuredImage || (images.length > 0 ? images[0] : ""),
      images: images,
      team: team,
      link: acf.link || wpProject.link || "",
    },
    content: description,
  };
}

// ============================================================================
// GRAPHQL FUNCTIONS - WordPress avec Pods et WPGraphQL
// ============================================================================

/**
 * Obtient le client GraphQL pour WordPress
 */
function getGraphQLClient() {
  const wordpressUrl = process.env.WORDPRESS_URL;

  if (!wordpressUrl) {
    throw new Error("WORDPRESS_URL n'est pas défini dans les variables d'environnement");
  }

  const graphqlEndpoint = `${wordpressUrl}/graphql`;

  return new GraphQLClient(graphqlEndpoint, {
    next: { revalidate: 60 }, // Cache pendant 1 minute
  });
}

// Types GraphQL pour les posts
type GraphQLMediaItem = {
  sourceUrl: string;
  mediaDetails?: {
    sizes?: Array<{
      name: string;
      sourceUrl: string;
    }>;
  };
};

type GraphQLPostNode = {
  id: string;
  databaseId: number;
  slug: string;
  date: string;
  title: string;
  content: string;
  excerpt: string;
  featuredImage?: {
    node: GraphQLMediaItem;
  } | null;
  link: string;
  // Champs Pods - adaptez selon votre structure Pods
  pods?: {
    tag?: string;
    summary?: string;
    image?: string;
    images?: string; // URLs séparées par \n ou tableau
    team?: string; // JSON string ou objet
    link?: string;
  } | null;
  // Alternative: champs Pods directement sur le post (selon configuration WPGraphQL Pods)
  [key: string]: any; // Pour les champs Pods dynamiques
};

type GraphQLPostsResponse = {
  posts: {
    nodes: GraphQLPostNode[];
  };
};

type GraphQLPostResponse = {
  postBy: GraphQLPostNode | null;
};

// Types GraphQL pour les projets (Custom Post Type)
type GraphQLProjectImage = {
  sourceUrl: string;
  mediaDetails?: {
    sizes?: Array<{
      name: string;
      sourceUrl: string;
    }>;
  };
};

type GraphQLProjectImagesConnection = {
  nodes: GraphQLProjectImage[];
};

type GraphQLProjectNode = {
  id: string;
  slug: string;
  date: string;
  title: string;
  link: string;
  // Champs Pods (exposés directement, en camelCase)
  extrait?: string; // Résumé
  description?: string; // Description WYSIWYG (remplace content)
  client?: string; // Nom du client
  lienDuSiteLiveSite?: string; // Lien du site (camelCase)
  images?: GraphQLProjectImagesConnection; // Images (connection avec nodes)
};

type GraphQLProjectsResponse = {
  projets: {
    nodes: GraphQLProjectNode[];
    pageInfo?: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
  };
};

type GraphQLProjectResponse = {
  projetBy: GraphQLProjectNode | null;
};

/**
 * Requête GraphQL pour récupérer tous les posts
 * Note: Les champs Pods pour les posts ne sont pas configurés dans votre WordPress
 * Si vous ajoutez des champs Pods aux posts, décommentez-les ci-dessous
 */
const GET_POSTS_QUERY = `
  query GetPosts {
    posts(first: 100, where: { status: PUBLISH }) {
      nodes {
        id
        databaseId
        slug
        date
        title
        content
        excerpt
        link
        featuredImage {
          node {
            sourceUrl
            mediaDetails {
              sizes {
                name
                sourceUrl
              }
            }
          }
        }
        # Champs Pods - décommentez si vous avez configuré des champs Pods pour les posts
        # tag
        # summary
        # image
        # images
        # team
      }
    }
  }
`;

/**
 * Requête GraphQL pour récupérer un post par slug
 */
const GET_POST_BY_SLUG_QUERY = `
  query GetPostBySlug($slug: String!) {
    postBy(slug: $slug) {
      id
      databaseId
      slug
      date
      title
      content
      excerpt
      link
      featuredImage {
        node {
          sourceUrl
          mediaDetails {
            sizes {
              name
              sourceUrl
            }
          }
        }
      }
      # Champs Pods - décommentez si vous avez configuré des champs Pods pour les posts
      # tag
      # summary
      # image
      # images
      # team
    }
  }
`;

/**
 * Requête GraphQL pour récupérer les projets (avec pagination)
 * Configuration Pods : Custom Post Type "projet"
 * La pagination permet de récupérer tous les projets même si WPGraphQL limite le nombre par requête.
 */
const GET_PROJECTS_PAGINATED_QUERY = `
  query GetProjects($first: Int!, $after: String) {
    projets(first: $first, after: $after, where: { status: PUBLISH }) {
      nodes {
        id
        slug
        date
        title
        link
        extrait
        description
        client
        lienDuSiteLiveSite
        images {
          nodes {
            sourceUrl
            mediaDetails {
              sizes {
                name
                sourceUrl
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

/** Requête simple sans pagination (fallback si pageInfo absent sur la connexion) */
const GET_PROJECTS_QUERY = `
  query GetProjects {
    projets(first: 100, where: { status: PUBLISH }) {
      nodes {
        id
        slug
        date
        title
        link
        extrait
        description
        client
        lienDuSiteLiveSite
        images {
          nodes {
            sourceUrl
            mediaDetails {
              sizes {
                name
                sourceUrl
              }
            }
          }
        }
      }
    }
  }
`;

/**
 * Requête GraphQL pour récupérer un projet par slug
 * Configuration Pods : Custom Post Type "projet"
 * Note: content, excerpt et featuredImage ne sont pas disponibles sur ce CPT
 */
const GET_PROJECT_BY_SLUG_QUERY = `
  query GetProjectBySlug($slug: String!) {
    projetBy(slug: $slug) {
      id
      slug
      date
      title
      link
      # Champs Pods (exposés directement, en camelCase)
      extrait
      description
      client
      lienDuSiteLiveSite
      images {
        nodes {
          sourceUrl
          mediaDetails {
            sizes {
              name
              sourceUrl
            }
          }
        }
      }
    }
  }
`;

/**
 * Récupère tous les articles depuis WordPress GraphQL
 */
export async function getWordPressPostsGraphQL(): Promise<Post[]> {
  const wordpressUrl = process.env.WORDPRESS_URL;

  if (!wordpressUrl) {
    console.warn("WORDPRESS_URL n'est pas défini dans les variables d'environnement");
    return [];
  }

  try {
    const client = getGraphQLClient();
    const data = await client.request<GraphQLPostsResponse>(GET_POSTS_QUERY);

    const posts = data.posts.nodes;
    console.log(`[getWordPressPostsGraphQL] ${posts.length} article(s) récupéré(s) depuis GraphQL`);

    const transformed = posts.map(transformGraphQLPost);
    console.log(`[getWordPressPostsGraphQL] Slugs transformés:`, transformed.map(p => p.slug));
    return transformed;
  } catch (error) {
    console.error("Erreur lors de la récupération des articles WordPress GraphQL:", error);
    return [];
  }
}

/**
 * Récupère un article spécifique par son slug via GraphQL
 */
export async function getWordPressPostBySlugGraphQL(slug: string): Promise<Post | null> {
  const wordpressUrl = process.env.WORDPRESS_URL;

  if (!wordpressUrl) {
    console.warn("WORDPRESS_URL n'est pas défini dans les variables d'environnement");
    return null;
  }

  try {
    const client = getGraphQLClient();
    console.log(`[getWordPressPostBySlugGraphQL] Recherche de l'article avec slug: "${slug}"`);
    const data = await client.request<GraphQLPostResponse>(GET_POST_BY_SLUG_QUERY, {
      slug,
    });

    if (!data.postBy) {
      console.warn(`[getWordPressPostBySlugGraphQL] Article non trouvé pour slug: "${slug}"`);
      return null;
    }

    console.log(`[getWordPressPostBySlugGraphQL] Article trouvé: ${data.postBy.title}`);
    return transformGraphQLPost(data.postBy);
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'article ${slug} via GraphQL:`, error);
    return null;
  }
}

/**
 * Transforme un post GraphQL en format compatible avec l'application
 */
function transformGraphQLPost(graphqlPost: GraphQLPostNode): Post {
  // Extraire l'image featured
  let featuredImage = "";
  if (graphqlPost.featuredImage?.node) {
    const media = graphqlPost.featuredImage.node;
    // Chercher la taille large, sinon medium_large, sinon sourceUrl
    const largeSize = media.mediaDetails?.sizes?.find((s) => s.name === "large");
    const mediumLargeSize = media.mediaDetails?.sizes?.find((s) => s.name === "medium_large");
    featuredImage = largeSize?.sourceUrl || mediumLargeSize?.sourceUrl || media.sourceUrl;
  }

  // Extraire le résumé (excerpt) en texte brut
  const excerpt = graphqlPost.excerpt
    .replace(/<[^>]*>/g, "")
    .replace(/&[^;]+;/g, " ")
    .trim();

  // Extraire les métadonnées Pods (si configurés)
  // Note: Les champs Pods ne sont pas configurés pour les posts dans votre WordPress
  const tag = graphqlPost.tag || "";
  const summary = graphqlPost.summary || excerpt || "";
  const image = graphqlPost.image || featuredImage || "";

  // Parser les images (peut être string avec \n ou tableau)
  let images: string[] = [];
  const imagesData = graphqlPost.images;
  if (imagesData) {
    if (typeof imagesData === "string") {
      images = imagesData
        .split("\n")
        .map((url) => url.trim())
        .filter((url) => url.length > 0);
    } else if (Array.isArray(imagesData)) {
      images = imagesData;
    }
  }
  if (images.length === 0 && featuredImage) {
    images = [featuredImage];
  }

  // Parser l'équipe (peut être JSON string ou objet)
  let team: Team[] = [];
  const teamData = graphqlPost.team;
  if (teamData) {
    if (typeof teamData === "string") {
      try {
        const parsed = JSON.parse(teamData);
        if (Array.isArray(parsed)) {
          team = parsed;
        }
      } catch (e) {
        console.warn(`⚠️ Erreur lors du parsing du JSON team pour le post ${graphqlPost.slug}:`, e);
      }
    } else if (Array.isArray(teamData)) {
      team = teamData;
    }
  }

  const link = graphqlPost.link || "";

  return {
    slug: graphqlPost.slug,
    id: graphqlPost.databaseId,
    metadata: {
      title: decodeHTMLEntities(graphqlPost.title),
      publishedAt: graphqlPost.date,
      summary: summary,
      image: image,
      images: images,
      tag: tag,
      team: team,
      link: link,
    },
    content: graphqlPost.content,
  };
}

/**
 * Récupère tous les projets depuis WordPress GraphQL (avec pagination)
 * Récupère toutes les pages pour contourner une éventuelle limite WPGraphQL (ex. 10 par requête).
 */
export async function getWordPressProjectsGraphQL(): Promise<Project[]> {
  const wordpressUrl = process.env.WORDPRESS_URL;

  if (!wordpressUrl) {
    console.warn("WORDPRESS_URL n'est pas défini dans les variables d'environnement");
    return [];
  }

  try {
    const client = getGraphQLClient();
    const allNodes: GraphQLProjectNode[] = [];
    let after: string | null = null;
    const pageSize = 100;

    // Pagination : récupérer toutes les pages (contourne la limite par requête de WPGraphQL)
    try {
      do {
        const data: GraphQLProjectsResponse = await client.request(GET_PROJECTS_PAGINATED_QUERY, {
          first: pageSize,
          after,
        });

        const nodes = data.projets?.nodes || [];
        allNodes.push(...nodes);

        const hasNextPage = data.projets?.pageInfo?.hasNextPage ?? false;
        after = data.projets?.pageInfo?.endCursor ?? null;

        if (nodes.length < pageSize) break;
      } while (after);
    } catch (paginatedError) {
      // Fallback : requête simple si la connexion ne supporte pas pageInfo (ex. ancienne config Pods)
      const data: GraphQLProjectsResponse = await client.request(GET_PROJECTS_QUERY);
      const nodes = data.projets?.nodes || [];
      allNodes.push(...nodes);
    }

    console.log(`[getWordPressProjectsGraphQL] ${allNodes.length} projet(s) récupéré(s) depuis GraphQL`);

    const transformed = allNodes.map(transformGraphQLProject);
    console.log(`[getWordPressProjectsGraphQL] Slugs:`, transformed.map((p) => p.slug));
    return transformed;
  } catch (error) {
    console.error("Erreur lors de la récupération des projets WordPress GraphQL:", error);
    console.warn("⚠️ Vérifiez que le Custom Post Type 'projet' est bien exposé dans WPGraphQL (Pods) et que les 3 projets sont en statut « Publié ».");
    return [];
  }
}

/**
 * Récupère un projet spécifique par son slug via GraphQL
 */
export async function getWordPressProjectBySlugGraphQL(slug: string): Promise<Project | null> {
  const wordpressUrl = process.env.WORDPRESS_URL;

  if (!wordpressUrl) {
    console.warn("WORDPRESS_URL n'est pas défini dans les variables d'environnement");
    return null;
  }

  try {
    const client = getGraphQLClient();
    console.log(`[getWordPressProjectBySlugGraphQL] Recherche du projet avec slug: "${slug}"`);
    const data = await client.request<GraphQLProjectResponse>(GET_PROJECT_BY_SLUG_QUERY, {
      slug,
    });

    if (!data.projetBy) {
      console.warn(`[getWordPressProjectBySlugGraphQL] Projet non trouvé pour slug: "${slug}"`);
      return null;
    }

    console.log(`[getWordPressProjectBySlugGraphQL] Projet trouvé: ${data.projetBy.title}`);
    return transformGraphQLProject(data.projetBy);
  } catch (error) {
    console.error(`Erreur lors de la récupération du projet ${slug} via GraphQL:`, error);
    return null;
  }
}

/**
 * Transforme un projet GraphQL en format compatible avec l'application
 */
function transformGraphQLProject(graphqlProject: GraphQLProjectNode): Project {
  // Extraire les métadonnées Pods
  // extrait = résumé (summary) - nettoyer le HTML
  let summary = graphqlProject.extrait || "";
  if (summary) {
    // Nettoyer le HTML du résumé
    summary = summary
      .replace(/<[^>]*>/g, "")
      .replace(/&[^;]+;/g, " ")
      .trim();
  }

  // Parser les images (champ file multi - connection avec nodes)
  let images: string[] = [];
  if (graphqlProject.images?.nodes && Array.isArray(graphqlProject.images.nodes)) {
    images = graphqlProject.images.nodes.map((img) => {
      // Chercher la taille large, sinon medium_large, sinon sourceUrl
      const largeSize = img.mediaDetails?.sizes?.find((s) => s.name === "large");
      const mediumLargeSize = img.mediaDetails?.sizes?.find((s) => s.name === "medium_large");
      return largeSize?.sourceUrl || mediumLargeSize?.sourceUrl || img.sourceUrl;
    });
  }

  // Image featured = première image de la galerie
  const featuredImage = images.length > 0 ? images[0] : "";

  // L'équipe n'est pas dans votre structure Pods, donc tableau vide
  const team: Team[] = [];

  // Lien du site (lienDuSiteLiveSite en camelCase)
  const link = graphqlProject.lienDuSiteLiveSite || graphqlProject.link || "";

  // Client
  const client = graphqlProject.client || "";

  // Description (champ WYSIWYG Pods - remplace content)
  const description = graphqlProject.description || "";

  return {
    slug: graphqlProject.slug,
    metadata: {
      title: decodeHTMLEntities(graphqlProject.title),
      publishedAt: graphqlProject.date,
      summary: summary,
      image: featuredImage,
      images: images,
      team: team,
      link: link,
      client: client,
    },
    content: description,
  };
}
