import { notFound } from "next/navigation";
import { getWordPressProjectBySlug, getWordPressProjects } from "@/utils/wordpress";
import {
  Meta,
  Schema,
  AvatarGroup,
  Button,
  Column,
  Flex,
  Heading,
  Media,
  Text,
  SmartLink,
  Row,
  Avatar,
  Line,
  Carousel,
} from "@once-ui-system/core";
import { baseURL, about, person, work } from "@/resources";
import { formatDate } from "@/utils/formatDate";
import { ScrollToHash, CustomMDX } from "@/components";
import { Metadata } from "next";
import { Projects } from "@/components/work/Projects";

// Permettre les routes dynamiques pour que les changements de slug soient pris en compte
export const dynamicParams = true;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
  const projects = await getWordPressProjects();
    console.log(`[generateStaticParams] ${projects.length} projet(s) trouvé(s)`);
    const slugs = projects.map((project) => ({
    slug: project.slug,
  }));
    console.log(`[generateStaticParams] Slugs générés:`, slugs.map(s => s.slug));
    return slugs;
  } catch (error) {
    console.error("[generateStaticParams] Erreur:", error);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string | string[] }>;
}): Promise<Metadata> {
  const routeParams = await params;
  const slugPath = Array.isArray(routeParams.slug)
    ? routeParams.slug.join("/")
    : routeParams.slug || "";

  const project = await getWordPressProjectBySlug(slugPath);

  if (!project) return {};

  return Meta.generate({
    title: project.metadata.title,
    description: project.metadata.summary,
    baseURL: baseURL,
    image: project.metadata.image || `/api/og/generate?title=${project.metadata.title}`,
    path: `${work.path}/${project.slug}`,
  });
}

export default async function Project({
  params,
}: {
  params: Promise<{ slug: string | string[] }>;
}) {
  const routeParams = await params;
  const slugPath = Array.isArray(routeParams.slug)
    ? routeParams.slug.join("/")
    : routeParams.slug || "";

  console.log(`[Project page] Recherche du projet avec slug: "${slugPath}"`);
  const post = await getWordPressProjectBySlug(slugPath);

  if (!post) {
    console.error(`[Project page] Projet non trouvé pour slug: "${slugPath}"`);
    notFound();
  }

  console.log(`[Project page] Projet trouvé: ${post.metadata.title}`);

  const avatars =
    post.metadata.team?.map((person) => ({
      src: person.avatar,
    })) || [];

  return (
    <Column as="section" maxWidth="m" horizontal="center" gap="l">
      <Schema
        as="blogPosting"
        baseURL={baseURL}
        path={`${work.path}/${post.slug}`}
        title={post.metadata.title}
        description={post.metadata.summary}
        datePublished={post.metadata.publishedAt}
        dateModified={post.metadata.publishedAt}
        image={
          post.metadata.image || `/api/og/generate?title=${encodeURIComponent(post.metadata.title)}`
        }
        author={{
          name: person.name,
          url: `${baseURL}${about.path}`,
          image: `${baseURL}${person.avatar}`,
        }}
      />
      <Column maxWidth="s" gap="16" horizontal="center" align="center">
        <SmartLink href={work.path}>
          <Text variant="label-strong-m">Projets</Text>
        </SmartLink>
        <Text variant="body-default-xs" onBackground="neutral-weak" marginBottom="12">
          {post.metadata.publishedAt && formatDate(post.metadata.publishedAt)}
        </Text>
        <Heading variant="display-strong-m">{post.metadata.title}</Heading>
        {post.metadata.client && (
          <Text variant="label-default-m" onBackground="brand-weak" marginTop="8">
            Client: {post.metadata.client}
          </Text>
        )}
        {post.metadata.summary && (
          <Text variant="body-default-m" onBackground="neutral-weak" align="center" marginTop="8">
            {post.metadata.summary}
          </Text>
        )}
      </Column>
      <Row marginBottom="32" horizontal="center" gap="24" wrap>
        {post.metadata.team && post.metadata.team.length > 0 && (
          <Row gap="16" vertical="center">
            <AvatarGroup reverse avatars={avatars} size="s" />
            <Text variant="label-default-m" onBackground="brand-weak">
              {post.metadata.team.map((member, idx) => (
                <span key={idx}>
                  {idx > 0 && (
                    <Text as="span" onBackground="neutral-weak">
                      ,{" "}
                    </Text>
                  )}
                  {member.linkedIn ? (
                    <SmartLink href={member.linkedIn}>{member.name}</SmartLink>
                  ) : (
                    <span>{member.name}</span>
                  )}
                </span>
              ))}
            </Text>
          </Row>
        )}
        {post.metadata.link && (
          <Button
            href={post.metadata.link}
            target="_blank"
            rel="noopener noreferrer"
            variant="primary"
            size="m"
            suffixIcon="arrowUpRightFromSquare"
          >
            <Text variant="body-default-s">Visiter le site</Text>
          </Button>
        )}
      </Row>
      {post.metadata.images.length > 0 && (
        <Carousel
          sizes="(max-width: 960px) 100vw, 960px"
          items={post.metadata.images.map((image) => ({
            slide: image,
            alt: post.metadata.title,
          }))}
        />
      )}
      {post.content && post.content.trim() && (
        <Column as="article" maxWidth="s" marginTop="32" gap="16" fillWidth>
          <CustomMDX html={post.content} />
        </Column>
      )}
      <Column fillWidth gap="40" horizontal="center" marginTop="40">
        <Line maxWidth="40" />
        <Heading as="h2" variant="heading-strong-xl" marginBottom="24">
          Projets similaires
        </Heading>
        <Projects exclude={[post.slug]} range={[1, 3]} />
      </Column>
      <ScrollToHash />
    </Column>
  );
}
