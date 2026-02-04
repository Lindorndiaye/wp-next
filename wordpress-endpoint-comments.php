<?php
/**
 * Plugin Name: Comments Endpoint
 * Description: Endpoint personnalisé pour recevoir les commentaires depuis Next.js vers les commentaires natifs WordPress
 * Version: 1.0
 */

// Enregistrer un endpoint REST API personnalisé
add_action('rest_api_init', function () {
    register_rest_route('custom/v1', '/comments', array(
        'methods' => 'POST',
        'callback' => 'handle_comment_submission',
        'permission_callback' => '__return_true', // Public endpoint
    ));
});

function handle_comment_submission($request) {
    // Récupérer les données depuis le body
    $postId = intval($request->get_param('postId'));
    $postSlug = sanitize_text_field($request->get_param('postSlug'));
    $parentId = intval($request->get_param('parentId') ?: 0);
    $authorName = sanitize_text_field($request->get_param('authorName'));
    $authorEmail = sanitize_email($request->get_param('authorEmail'));
    $authorUrl = esc_url_raw($request->get_param('authorUrl') ?: '');
    $content = sanitize_textarea_field($request->get_param('content'));
    
    // Validation
    if (empty($authorName) || empty($authorEmail) || empty($content)) {
        return new WP_Error('missing_fields', 'Tous les champs requis doivent être remplis', array('status' => 400));
    }
    
    if (!is_email($authorEmail)) {
        return new WP_Error('invalid_email', 'Email invalide', array('status' => 400));
    }
    
    if (strlen(trim($content)) < 10) {
        return new WP_Error('content_too_short', 'Le commentaire doit contenir au moins 10 caractères', array('status' => 400));
    }
    
    // Si on n'a pas le postId, chercher par slug
    if (!$postId && $postSlug) {
        $post = get_page_by_path($postSlug, OBJECT, 'post');
        if ($post) {
            $postId = $post->ID;
        } else {
            // Essayer avec WP_Query
            $query = new WP_Query(array(
                'name' => $postSlug,
                'post_type' => 'post',
                'post_status' => 'publish',
                'posts_per_page' => 1,
            ));
            
            if ($query->have_posts()) {
                $query->the_post();
                $postId = get_the_ID();
                wp_reset_postdata();
            }
        }
    }
    
    if (!$postId) {
        return new WP_Error('post_not_found', 'Article non trouvé', array('status' => 404));
    }
    
    // Vérifier que les commentaires sont activés pour ce post
    if (!comments_open($postId)) {
        return new WP_Error('comments_closed', 'Les commentaires sont fermés pour cet article', array('status' => 403));
    }
    
    // Créer le commentaire dans WordPress (commentaires natifs)
    $comment_data = array(
        'comment_post_ID' => $postId,
        'comment_author' => $authorName,
        'comment_author_email' => $authorEmail,
        'comment_author_url' => $authorUrl,
        'comment_content' => $content,
        'comment_parent' => $parentId,
        'comment_approved' => 0, // En attente de modération par défaut
        'comment_type' => 'comment', // Type de commentaire natif
    );
    
    $comment_id = wp_insert_comment($comment_data);
    
    if (is_wp_error($comment_id)) {
        return new WP_Error('comment_creation_failed', 'Erreur lors de la création du commentaire: ' . $comment_id->get_error_message(), array('status' => 500));
    }
    
    if (!$comment_id) {
        return new WP_Error('comment_creation_failed', 'Erreur lors de la création du commentaire', array('status' => 500));
    }
    
    // Optionnel: Envoyer un email de notification
    // WordPress envoie automatiquement un email si les notifications sont activées
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'Commentaire créé avec succès (en attente de modération)',
        'id' => $comment_id,
        'status' => 'hold', // En attente de modération
    ), 200);
}
