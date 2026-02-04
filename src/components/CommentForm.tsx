"use client";

import { Button, Input, Text, Column, Row, Avatar, Background, Heading } from "@once-ui-system/core";
import { opacity, SpacingToken } from "@once-ui-system/core";
import { useState, useEffect } from "react";
import { formatDate } from "@/utils/formatDate";
import { mailchimp } from "@/resources";

// Fonction pour générer un hash MD5 simple pour Gravatar
// Note: Ce n'est pas un vrai MD5, mais génère un identicon unique basé sur l'email
function getGravatarHash(email: string | undefined): string {
  // Gérer le cas où email est undefined ou vide
  if (!email || typeof email !== 'string') {
    email = 'anonymous@example.com';
  }

  const normalizedEmail = email.toLowerCase().trim();
  // Utiliser un hash simple pour générer un identicon unique
  let hash = 0;
  for (let i = 0; i < normalizedEmail.length; i++) {
    hash = ((hash << 5) - hash) + normalizedEmail.charCodeAt(i);
    hash = hash & hash;
  }
  // Générer un hash hexadécimal de 32 caractères (comme MD5)
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
  // Répéter pour obtenir 32 caractères
  return (hexHash + hexHash + hexHash + hexHash).substring(0, 32);
}

interface Comment {
  id: number;
  authorName: string;
  authorEmail: string;
  authorUrl: string;
  content: string;
  date: string;
  parent: number;
}

interface CommentFormProps {
  postId: number;
  postSlug: string;
  parentId?: number;
  onSuccess?: () => void;
}

export const CommentForm: React.FC<CommentFormProps> = ({
  postId,
  postSlug,
  parentId,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    authorName: "",
    authorEmail: "",
    content: "",
  });

  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Charger les commentaires existants
  useEffect(() => {
    const fetchComments = async () => {
      if (!postId) {
        console.warn("[CommentForm] postId n'est pas défini");
        setIsLoadingComments(false);
        return;
      }

      console.log(`[CommentForm] Chargement des commentaires pour postId: ${postId}`);

      try {
        const response = await fetch(`/api/comments/${postId}`);
        console.log(`[CommentForm] Réponse API:`, response.status, response.statusText);

        const data = await response.json();
        console.log(`[CommentForm] Données reçues:`, data);

        if (data.success && data.comments) {
          console.log(`[CommentForm] ${data.comments.length} commentaire(s) trouvé(s)`);
          setComments(data.comments);
        } else {
          console.warn("[CommentForm] Aucun commentaire trouvé ou erreur:", data.error);
          setComments([]);
        }
      } catch (error) {
        console.error("[CommentForm] Erreur lors du chargement des commentaires:", error);
        setComments([]);
      } finally {
        setIsLoadingComments(false);
      }
    };

    fetchComments();
  }, [postId]);

  const validateEmail = (email: string): boolean => {
    if (!email) return false;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const refreshComments = async () => {
    try {
      const response = await fetch(`/api/comments/${postId}`);
      const data = await response.json();
      if (data.success && data.comments) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error("Erreur lors du rechargement des commentaires:", error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.authorName.trim()) {
      newErrors.authorName = "Le nom est requis";
    }
    if (!formData.authorEmail.trim()) {
      newErrors.authorEmail = "L'email est requis";
    } else if (!validateEmail(formData.authorEmail)) {
      newErrors.authorEmail = "Email invalide";
    }
    if (!formData.content.trim()) {
      newErrors.content = "Le commentaire est requis";
    } else if (formData.content.trim().length < 10) {
      newErrors.content = "Le commentaire doit contenir au moins 10 caractères";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          postSlug,
          parentId: parentId || 0,
          authorName: formData.authorName.trim(),
          authorEmail: formData.authorEmail.trim(),
          authorUrl: "",
          content: formData.content.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setFormData({
          authorName: "",
          authorEmail: "",
          content: "",
        });
        // Recharger les commentaires après envoi
        await refreshComments();
        if (onSuccess) {
          onSuccess();
        }
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setErrors({ content: data.error || "Une erreur est survenue. Veuillez réessayer." });
      }
    } catch (err) {
      setErrors({ content: "Une erreur est survenue. Veuillez réessayer." });
      console.error("Erreur lors de l'envoi du commentaire:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Column fillWidth gap="xl" marginTop="l">

      {/* Liste des commentaires - AFFICHÉS EN PREMIER */}
      {isLoadingComments && (
        <Text variant="body-default-s" onBackground="neutral-weak" align="center" padding="l">
          Chargement des commentaires...
        </Text>
      )}

      {!isLoadingComments && comments.length === 0 && (
        <Text variant="body-default-s" onBackground="neutral-weak" align="center" padding="l">
          Aucun commentaire pour le moment. Soyez le premier à commenter !
        </Text>
      )}

      {comments.length > 0 && (
        <Column
          fillWidth
          padding="l"
          radius="m"
          background="surface"
          border="neutral-alpha-weak"
          gap="l"
        >
          <Text variant="heading-strong-m">Commentaires ({comments.length})</Text>
          <Column gap="l" fillWidth>
            {comments.map((comment) => (
              <Column
                key={comment.id}
                fillWidth
                padding="l"
                radius="m"
                background="surface"
                border="neutral-alpha-weak"
                gap="m"
              >
                <Row gap="m" vertical="center">
                  <Avatar
                    size="m"
                    src={`https://www.gravatar.com/avatar/${getGravatarHash(comment.authorEmail || comment.authorName || 'anonymous')}?d=identicon&s=80`}
                  />
                  <Column gap="4" flex={1}>
                    <Row gap="m" vertical="center" wrap>
                      <Text variant="label-strong-m">{comment.authorName}</Text>
                      {comment.authorUrl && (
                        <Text
                          variant="body-default-s"
                          onBackground="neutral-weak"
                          as="a"
                          href={comment.authorUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: "none" }}
                        >
                          {comment.authorUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        </Text>
                      )}
                    </Row>
                    {comment.date && (
                      <Text variant="body-default-xs" onBackground="neutral-weak">
                        {formatDate(comment.date)}
                      </Text>
                    )}
                  </Column>
                </Row>
                {comment.content && (
                  <Text
                    variant="body-default-m"
                    dangerouslySetInnerHTML={{ __html: comment.content }}
                  />
                )}
              </Column>
            ))}
          </Column>
        </Column>
      )}

      {/* Formulaire de commentaire - AFFICHÉ APRÈS LES COMMENTAIRES */}
      <Column
        overflow="hidden"
        fillWidth
        padding="xl"
        radius="l"
        marginBottom="m"
        horizontal="center"
        align="center"
        background="surface"
        border="neutral-alpha-weak"
      >
        <Background
          top="0"
          position="absolute"
          mask={{
            x: mailchimp.effects.mask.x,
            y: mailchimp.effects.mask.y,
            radius: mailchimp.effects.mask.radius,
            cursor: mailchimp.effects.mask.cursor,
          }}
          gradient={{
            display: mailchimp.effects.gradient.display,
            opacity: mailchimp.effects.gradient.opacity as opacity,
            x: mailchimp.effects.gradient.x,
            y: mailchimp.effects.gradient.y,
            width: mailchimp.effects.gradient.width,
            height: mailchimp.effects.gradient.height,
            tilt: mailchimp.effects.gradient.tilt,
            colorStart: mailchimp.effects.gradient.colorStart,
            colorEnd: mailchimp.effects.gradient.colorEnd,
          }}
          dots={{
            display: mailchimp.effects.dots.display,
            opacity: mailchimp.effects.dots.opacity as opacity,
            size: mailchimp.effects.dots.size as SpacingToken,
            color: mailchimp.effects.dots.color,
          }}
          grid={{
            display: mailchimp.effects.grid.display,
            opacity: mailchimp.effects.grid.opacity as opacity,
            color: mailchimp.effects.grid.color,
            width: mailchimp.effects.grid.width,
            height: mailchimp.effects.grid.height,
          }}
          lines={{
            display: mailchimp.effects.lines.display,
            opacity: mailchimp.effects.lines.opacity as opacity,
            size: mailchimp.effects.lines.size as SpacingToken,
            thickness: mailchimp.effects.lines.thickness,
            angle: mailchimp.effects.lines.angle,
            color: mailchimp.effects.lines.color,
          }}
        />
        <Column maxWidth="xs" horizontal="center">
          <Heading marginBottom="s" variant="display-strong-xs">
            Laisser un commentaire
          </Heading>
        </Column>
        <form onSubmit={handleSubmit} style={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <Column gap="l" fillWidth style={{ maxWidth: "45rem" }}>
            {/* Nom et Email sur la même ligne */}
            <Row gap="l" fillWidth s={{ direction: "column" }}>
              <Column gap="4" flex={1} fillWidth>
                <Input
                  id="authorName"
                  name="authorName"
                  type="text"
                  placeholder="Votre nom"
                  required
                  value={formData.authorName}
                  onChange={(e) => handleChange("authorName", e.target.value)}
                  errorMessage={errors.authorName}
                  disabled={isSubmitting}
                />
              </Column>
              <Column gap="4" flex={1} fillWidth>
                <Input
                  id="authorEmail"
                  name="authorEmail"
                  type="email"
                  placeholder="votre@email.com"
                  required
                  value={formData.authorEmail}
                  onChange={(e) => handleChange("authorEmail", e.target.value)}
                  errorMessage={errors.authorEmail}
                  disabled={isSubmitting}
                />
              </Column>
            </Row>

            {/* Commentaire */}
            <Column gap="4" fillWidth>
              <textarea
                id="content"
                name="content"
                required
                rows={6}
                placeholder="Votre commentaire..."
                value={formData.content}
                onChange={(e) => handleChange("content", e.target.value)}
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  padding: "var(--static-space-12)",
                  borderRadius: "var(--static-radius-l)",
                  border: errors.content
                    ? "1px solid var(--color-error-strong)"
                    : "1px solid var(--color-neutral-border-medium)",
                  backgroundColor: "var(--color-neutral-background-alpha-weak)",
                  color: "var(--color-neutral-on-background-strong)",
                  fontSize: "var(--static-font-size-m)",
                  fontFamily: "var(--font-body)",
                  resize: "vertical",
                  minHeight: "120px",
                  transition: "all var(--static-transition-micro-medium)",
                  outline: "none",
                }}
                onFocus={(e) => {
                  if (!errors.content) {
                    e.target.style.borderColor = "var(--color-neutral-border-strong)";
                  }
                }}
                onBlur={(e) => {
                  if (!errors.content) {
                    e.target.style.borderColor = "var(--color-neutral-border-medium)";
                  }
                }}
              />
              {errors.content && (
                <Text
                  variant="body-default-s"
                  style={{ color: "var(--color-error-strong)" }}
                >
                  {errors.content}
                </Text>
              )}
            </Column>

            {/* Bouton de soumission */}
            <Row fillWidth horizontal="end">
              <Button
                type="submit"
                size="m"
                disabled={isSubmitting || Object.keys(errors).length > 0}
              >
                {isSubmitting ? "Envoi en cours..." : "Publier le commentaire"}
              </Button>
            </Row>
          </Column>
        </form>

        {/* Message de succès */}
        {success && (
          <Column gap="8" marginTop="l" align="center" fillWidth>
            <Text
              variant="body-default-m"
              align="center"
              padding="16"
              style={{
                backgroundColor: "rgba(34, 197, 94, 0.1)",
                color: "#16a34a",
                width: "100%",
                border: "1px solid rgba(34, 197, 94, 0.2)",
                borderRadius: "var(--static-radius-m)",
              }}
            >
              ✅ Votre commentaire a été envoyé et est en attente de modération.
            </Text>
          </Column>
        )}
      </Column>
    </Column>
  );
};
