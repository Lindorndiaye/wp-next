import { MDXRemote, MDXRemoteProps } from "next-mdx-remote/rsc";
import React, { ReactNode } from "react";
import { slugify as transliterate } from "transliteration";

import {
  Heading,
  HeadingLink,
  Text,
  InlineCode,
  CodeBlock,
  TextProps,
  MediaProps,
  Accordion,
  AccordionGroup,
  Table,
  Feedback,
  Button,
  Card,
  Grid,
  Row,
  Column,
  Icon,
  Media,
  SmartLink,
  List,
  ListItem,
  Line,
} from "@once-ui-system/core";

type CustomLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
};

function CustomLink({ href, children, ...props }: CustomLinkProps) {
  if (href.startsWith("/")) {
    return (
      <SmartLink href={href} {...props}>
        {children}
      </SmartLink>
    );
  }

  if (href.startsWith("#")) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  );
}

function createImage({ alt, src, ...props }: MediaProps & { src: string }) {
  if (!src) {
    console.error("Media requires a valid 'src' property.");
    return null;
  }

  return (
    <Media
      marginTop="8"
      marginBottom="16"
      enlarge
      radius="m"
      border="neutral-alpha-medium"
      sizes="(max-width: 960px) 100vw, 960px"
      alt={alt}
      src={src}
      {...props}
    />
  );
}

function slugify(str: string): string {
  const strWithAnd = str.replace(/&/g, " and "); // Replace & with 'and'
  return transliterate(strWithAnd, {
    lowercase: true,
    separator: "-", // Replace spaces with -
  }).replace(/\-\-+/g, "-"); // Replace multiple - with single -
}

/**
 * Décode les entités HTML et extrait le texte brut (fonctionne côté serveur et client)
 */
function extractTextFromHTML(html: string): string {
  if (!html) return html;
  
  // D'abord, décoder les entités HTML courantes
  let text = html
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2019;/gi, "'")
    .replace(/&#x2018;/gi, "'")
    .replace(/&#x201C;/gi, '"')
    .replace(/&#x201D;/gi, '"');
  
  // Ensuite, supprimer toutes les balises HTML pour obtenir le texte brut
  text = text.replace(/<[^>]+>/g, '');
  
  return text.trim();
}

/**
 * Traite le HTML WordPress pour ajouter des IDs aux titres (h2-h6)
 * Cela permet à la navigation "On this page" de fonctionner
 */
function processWordPressHTML(html: string): string {
  if (!html) return html;
  
  let processedHtml = html;
  const headingIds = new Map<string, number>(); // Pour gérer les doublons
  
  // Utiliser une regex pour trouver tous les titres h2-h6
  // Pattern qui gère les balises imbriquées en utilisant une approche non-greedy
  // Utiliser [\s\S] au lieu de . pour matcher tous les caractères y compris les retours à la ligne
  const headingRegex = /<(h[2-6])([^>]*?)>([\s\S]*?)<\/h[2-6]>/gi;
  
  processedHtml = processedHtml.replace(headingRegex, (match, tag, attributes, content) => {
    // Vérifier si l'ID existe déjà dans les attributs
    const idMatch = attributes.match(/id\s*=\s*["']([^"']+)["']/i);
    if (idMatch) {
      // Si l'ID existe déjà, ne rien changer
      return match;
    }
    
    // Extraire le texte brut du contenu (sans les balises HTML)
    const cleanText = extractTextFromHTML(content);
    
    if (!cleanText) {
      // Si pas de texte, ne pas ajouter d'ID
      return match;
    }
    
    // Créer un slug à partir du texte
    let slug = slugify(cleanText);
    
    // Gérer les doublons
    if (headingIds.has(slug)) {
      const count = headingIds.get(slug)! + 1;
      headingIds.set(slug, count);
      slug = `${slug}-${count}`;
    } else {
      headingIds.set(slug, 0);
    }
    
    // Ajouter l'ID aux attributs
    const newAttributes = attributes.trim() 
      ? `${attributes.trim()} id="${slug}"`
      : `id="${slug}"`;
    
    return `<${tag} ${newAttributes}>${content}</${tag}>`;
  });
  
  return processedHtml;
}

function createHeading(as: "h1" | "h2" | "h3" | "h4" | "h5" | "h6") {
  const CustomHeading = ({
    children,
    ...props
  }: Omit<React.ComponentProps<typeof HeadingLink>, "as" | "id">) => {
    const slug = slugify(children as string);
    return (
      <HeadingLink marginTop="24" marginBottom="12" as={as} id={slug} {...props}>
        {children}
      </HeadingLink>
    );
  };

  CustomHeading.displayName = `${as}`;

  return CustomHeading;
}

function createParagraph({ children }: TextProps) {
  return (
    <Text
      style={{ lineHeight: "175%" }}
      variant="body-default-m"
      onBackground="neutral-medium"
      marginTop="8"
      marginBottom="12"
    >
      {children}
    </Text>
  );
}

function createInlineCode({ children }: { children: ReactNode }) {
  return <InlineCode>{children}</InlineCode>;
}

function createCodeBlock(props: any) {
  // For pre tags that contain code blocks
  if (props.children && props.children.props && props.children.props.className) {
    const { className, children } = props.children.props;

    // Extract language from className (format: language-xxx)
    const language = className.replace("language-", "");
    const label = language.charAt(0).toUpperCase() + language.slice(1);

    return (
      <CodeBlock
        marginTop="8"
        marginBottom="16"
        codes={[
          {
            code: children,
            language,
            label,
          },
        ]}
        copyButton={true}
      />
    );
  }

  // Fallback for other pre tags or empty code blocks
  return <pre {...props} />;
}

function createList({ children }: { children: ReactNode }) {
  return <List>{children}</List>;
}

function createListItem({ children }: { children: ReactNode }) {
  return (
    <ListItem marginTop="4" marginBottom="8" style={{ lineHeight: "175%" }}>
      {children}
    </ListItem>
  );
}

function createHR() {
  return (
    <Row fillWidth horizontal="center">
      <Line maxWidth="40" />
    </Row>
  );
}

const components = {
  p: createParagraph as any,
  h1: createHeading("h1") as any,
  h2: createHeading("h2") as any,
  h3: createHeading("h3") as any,
  h4: createHeading("h4") as any,
  h5: createHeading("h5") as any,
  h6: createHeading("h6") as any,
  img: createImage as any,
  a: CustomLink as any,
  code: createInlineCode as any,
  pre: createCodeBlock as any,
  ol: createList as any,
  ul: createList as any,
  li: createListItem as any,
  hr: createHR as any,
  Heading,
  Text,
  CodeBlock,
  InlineCode,
  Accordion,
  AccordionGroup,
  Table,
  Feedback,
  Button,
  Card,
  Grid,
  Row,
  Column,
  Icon,
  Media,
  SmartLink,
};

type CustomMDXProps = Omit<MDXRemoteProps, 'source'> & {
  components?: typeof components;
  source?: string;
  html?: string; // Pour le contenu HTML de WordPress
};

export function CustomMDX(props: CustomMDXProps) {
  // Si c'est du HTML (depuis WordPress), utiliser dangerouslySetInnerHTML
  if (props.html && props.html.trim()) {
    // Traiter le HTML pour ajouter des IDs aux titres
    const processedHtml = processWordPressHTML(props.html);
    
    return (
      <div
        dangerouslySetInnerHTML={{ __html: processedHtml }}
        className="wp-content"
        style={{
          lineHeight: "175%",
          width: "100%",
          color: "inherit",
        }}
      />
    );
  }

  // Sinon, utiliser MDXRemote pour le contenu MDX
  // Exclure 'html' des props car MDXRemote ne l'accepte pas
  const { html, ...mdxProps } = props;
  // MDXRemote nécessite 'source', donc on doit s'assurer qu'il est présent
  if (!mdxProps.source) {
    console.warn("CustomMDX: 'source' prop is required when 'html' is not provided");
    return null;
  }
  return <MDXRemote {...(mdxProps as MDXRemoteProps)} components={{ ...components, ...(props.components || {}) }} />;
}
