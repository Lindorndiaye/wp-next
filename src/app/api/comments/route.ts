import { NextRequest, NextResponse } from "next/server";

/**
 * Route API pour créer un commentaire dans WordPress
 * 
 * Cette route reçoit les données du formulaire de commentaire et les envoie vers WordPress
 * via l'API REST WordPress
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, postSlug, parentId, authorName, authorEmail, authorUrl, content } = body;

    // Validation des champs requis
    if (!authorName || !authorEmail || !content) {
      return NextResponse.json(
        { error: "Tous les champs requis doivent être remplis", success: false },
        { status: 400 }
      );
    }

    // Valider l'email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(authorEmail)) {
      return NextResponse.json(
        { error: "Email invalide", success: false },
        { status: 400 }
      );
    }

    // Valider le contenu
    if (content.trim().length < 10) {
      return NextResponse.json(
        { error: "Le commentaire doit contenir au moins 10 caractères", success: false },
        { status: 400 }
      );
    }

    const wordpressUrl = process.env.WORDPRESS_URL;

    if (!wordpressUrl) {
      console.error("[Comments] WORDPRESS_URL n'est pas défini dans .env.local");
      return NextResponse.json(
        { error: "Configuration serveur manquante", success: false },
        { status: 500 }
      );
    }

    // Option 1: Utiliser l'endpoint personnalisé (RECOMMANDÉ - pas d'authentification nécessaire)
    try {
      const customEndpointResponse = await fetch(`${wordpressUrl}/wp-json/custom/v1/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          postSlug,
          parentId: parentId || 0,
          authorName: authorName.trim(),
          authorEmail: authorEmail.trim(),
          authorUrl: authorUrl?.trim() || "",
          content: content.trim(),
        }),
      });

      if (customEndpointResponse.ok) {
        const result = await customEndpointResponse.json();
        console.log(`[Comments] ✅ Commentaire enregistré via endpoint personnalisé: ${authorEmail} (ID: ${result.id || 'N/A'})`);
        return NextResponse.json({
          success: true,
          message: "Commentaire envoyé avec succès",
          commentId: result.id,
        });
      } else {
        const errorData = await customEndpointResponse.json().catch(() => ({}));
        console.warn("[Comments] ⚠️ Endpoint personnalisé non disponible:", customEndpointResponse.status);
        console.warn("[Comments] Installez le plugin wordpress-endpoint-comments.php");
      }
    } catch (endpointError) {
      console.warn("[Comments] ⚠️ Erreur endpoint personnalisé:", endpointError);
    }

    // Option 2: REST API WordPress standard (nécessite que les commentaires soient ouverts publiquement)
    try {
      // Si on a le postId, on l'utilise directement, sinon on cherche par slug
      let wpPostId = postId;

      if (!wpPostId && postSlug) {
        // Récupérer l'ID du post depuis le slug
        const postResponse = await fetch(
          `${wordpressUrl}/wp-json/wp/v2/posts?slug=${encodeURIComponent(postSlug)}&_fields=id`
        );
        
        if (postResponse.ok) {
          const posts = await postResponse.json();
          if (posts.length > 0) {
            wpPostId = posts[0].id;
          }
        }
      }

      if (!wpPostId) {
        return NextResponse.json(
          { error: "Article non trouvé", success: false },
          { status: 404 }
        );
      }

      // Créer le commentaire via REST API WordPress
      const createResponse = await fetch(`${wordpressUrl}/wp-json/wp/v2/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          post: wpPostId,
          author_name: authorName.trim(),
          author_email: authorEmail.trim(),
          author_url: authorUrl?.trim() || "",
          content: content.trim(),
          parent: parentId || 0,
          status: "hold", // En attente de modération par défaut
        }),
      });

      if (createResponse.ok) {
        const created = await createResponse.json();
        console.log(`[Comments] ✅ Commentaire enregistré dans WordPress via REST API: ${authorEmail} (ID: ${created.id})`);
        return NextResponse.json({
          success: true,
          message: "Commentaire envoyé avec succès",
          commentId: created.id,
        });
      } else {
        const errorData = await createResponse.json().catch(() => ({}));
        console.error("[Comments] ❌ Erreur WordPress REST API:", createResponse.status, errorData);
        
        if (createResponse.status === 403) {
          return NextResponse.json(
            { error: "Les commentaires sont désactivés pour cet article", success: false },
            { status: 403 }
          );
        }
      }
    } catch (apiError) {
      console.error("[Comments] ❌ Erreur lors de l'appel WordPress REST API:", apiError);
    }

    // Si aucune méthode n'a fonctionné
    console.log("[Comments] 📝 Données reçues (WordPress non disponible):", {
      postId,
      postSlug,
      parentId,
      authorName,
      authorEmail,
      authorUrl,
      content,
    });

    return NextResponse.json(
      { error: "Impossible d'envoyer le commentaire. Veuillez réessayer plus tard.", success: false },
      { status: 500 }
    );
  } catch (error) {
    console.error("[Comments] ❌ Erreur lors du traitement du commentaire:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'envoi de votre commentaire", success: false },
      { status: 500 }
    );
  }
}
