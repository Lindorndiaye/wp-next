import { NextRequest, NextResponse } from "next/server";

/**
 * Route API pour récupérer les commentaires d'un article WordPress
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const postIdNum = parseInt(postId, 10);

    if (!postIdNum || isNaN(postIdNum)) {
      return NextResponse.json(
        { error: "ID d'article invalide", success: false },
        { status: 400 }
      );
    }

    const wordpressUrl = process.env.WORDPRESS_URL;
    
    // Vérifier si le postId correspond bien à un post WordPress
    // Parfois GraphQL databaseId peut différer de l'ID REST
    console.log(`[Comments API] Vérification du postId ${postIdNum} dans WordPress...`);
    const postCheckResponse = await fetch(
      `${wordpressUrl}/wp-json/wp/v2/posts/${postIdNum}?_fields=id,slug`,
      { next: { revalidate: 60 } }
    );
    
    let actualPostId = postIdNum;
    if (!postCheckResponse.ok) {
      console.warn(`[Comments API] PostId ${postIdNum} non trouvé directement, recherche alternative...`);
      // Le postId de GraphQL pourrait ne pas correspondre, on va chercher autrement
    } else {
      const postData = await postCheckResponse.json();
      actualPostId = postData.id;
      console.log(`[Comments API] Post trouvé: ID=${actualPostId}, Slug=${postData.slug}`);
    }

    if (!wordpressUrl) {
      console.error("[Comments] WORDPRESS_URL n'est pas défini dans .env.local");
      return NextResponse.json(
        { error: "Configuration serveur manquante", success: false },
        { status: 500 }
      );
    }

    // Essayer plusieurs méthodes pour récupérer les commentaires
    // Méthode 1: Par post ID (celui vérifié)
    let commentsUrl = `${wordpressUrl}/wp-json/wp/v2/comments?post=${actualPostId}&status=approved&orderby=date&order=asc&per_page=100`;
    console.log(`[Comments API] Tentative 1 - Récupération des commentaires depuis: ${commentsUrl}`);
    
    let commentsResponse = await fetch(commentsUrl, {
      next: { revalidate: 60 },
    });

    console.log(`[Comments API] Statut de la réponse (méthode 1): ${commentsResponse.status}`);

    // Si ça ne fonctionne pas, essayer sans le filtre status
    if (!commentsResponse.ok || commentsResponse.status === 400) {
      commentsUrl = `${wordpressUrl}/wp-json/wp/v2/comments?post=${actualPostId}&orderby=date&order=asc&per_page=100`;
      console.log(`[Comments API] Tentative 2 - Sans filtre status: ${commentsUrl}`);
      commentsResponse = await fetch(commentsUrl, {
        next: { revalidate: 60 },
      });
      console.log(`[Comments API] Statut de la réponse (méthode 2): ${commentsResponse.status}`);
    }
    
    // Si toujours pas de résultats, essayer avec le postId original aussi
    if ((!commentsResponse.ok || commentsResponse.status === 400) && actualPostId !== postIdNum) {
      commentsUrl = `${wordpressUrl}/wp-json/wp/v2/comments?post=${postIdNum}&orderby=date&order=asc&per_page=100`;
      console.log(`[Comments API] Tentative 3 - Avec postId original: ${commentsUrl}`);
      commentsResponse = await fetch(commentsUrl, {
        next: { revalidate: 60 },
      });
      console.log(`[Comments API] Statut de la réponse (méthode 3): ${commentsResponse.status}`);
    }

    if (!commentsResponse.ok) {
      const errorText = await commentsResponse.text();
      console.error("[Comments API] Erreur lors de la récupération des commentaires:", commentsResponse.status, errorText);
      
      // Essayer de récupérer tous les commentaires pour déboguer
      const allCommentsUrl = `${wordpressUrl}/wp-json/wp/v2/comments?per_page=10`;
      console.log(`[Comments API] Tentative de débogage - Tous les commentaires: ${allCommentsUrl}`);
      const debugResponse = await fetch(allCommentsUrl, { next: { revalidate: 60 } });
      if (debugResponse.ok) {
        const allComments = await debugResponse.json();
        console.log(`[Comments API] Debug - ${allComments.length} commentaire(s) trouvé(s) au total dans WordPress`);
        console.log(`[Comments API] Debug - Exemples de post IDs dans les commentaires:`, allComments.slice(0, 5).map((c: any) => ({ id: c.id, post: c.post })));
      }
      
      return NextResponse.json(
        { error: "Impossible de récupérer les commentaires", success: false },
        { status: commentsResponse.status }
      );
    }

    const comments = await commentsResponse.json();
    console.log(`[Comments API] ${comments.length} commentaire(s) récupéré(s) depuis WordPress pour postId ${actualPostId} (original: ${postIdNum})`);
    
    // Afficher les détails des commentaires pour déboguer
    if (comments.length > 0) {
      console.log(`[Comments API] Détails des commentaires:`, comments.map((c: any) => ({
        id: c.id,
        post: c.post,
        status: c.status,
        author: c.author_name,
      })));
    }
    
    // Filtrer manuellement les commentaires approuvés si nécessaire
    const approvedComments = comments.filter((comment: any) => {
      const isApproved = comment.status === 'approved' || comment.status === 'approve';
      console.log(`[Comments API] Commentaire ${comment.id}: status=${comment.status}, post=${comment.post}, approved=${isApproved}`);
      return isApproved;
    });
    console.log(`[Comments API] ${approvedComments.length} commentaire(s) approuvé(s) après filtrage`);

    // Utiliser les commentaires approuvés filtrés
    const commentsToFormat = approvedComments.length > 0 ? approvedComments : comments;
    
    // Transformer les commentaires pour le format attendu
    const formattedComments = commentsToFormat.map((comment: any) => ({
      id: comment.id,
      authorName: comment.author_name,
      authorEmail: comment.author_email,
      authorUrl: comment.author_url || "",
      content: comment.content.rendered,
      date: comment.date,
      dateGmt: comment.date_gmt,
      parent: comment.parent || 0,
    }));

    console.log(`[Comments API] ${formattedComments.length} commentaire(s) formaté(s)`);

    return NextResponse.json({
      success: true,
      comments: formattedComments,
    });
  } catch (error) {
    console.error("[Comments] ❌ Erreur lors de la récupération des commentaires:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue", success: false },
      { status: 500 }
    );
  }
}
