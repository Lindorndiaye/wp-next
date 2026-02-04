import { getWordPressPosts, getWordPressProjects } from "@/utils/wordpress";
import { baseURL, routes as routesConfig } from "@/resources";

export default async function sitemap() {
  const blogs = (await getWordPressPosts()).map((post) => ({
    url: `${baseURL}/blog/${post.slug}`,
    lastModified: post.metadata.publishedAt,
  }));

  const works = (await getWordPressProjects()).map((project) => ({
    url: `${baseURL}/projets/${project.slug}`,
    lastModified: project.metadata.publishedAt,
  }));

  const activeRoutes = Object.keys(routesConfig).filter(
    (route) => routesConfig[route as keyof typeof routesConfig],
  );

  const routes = activeRoutes.map((route) => ({
    url: `${baseURL}${route !== "/" ? route : ""}`,
    lastModified: new Date().toISOString().split("T")[0],
  }));

  return [...routes, ...blogs, ...works];
}
