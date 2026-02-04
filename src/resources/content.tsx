import { About, Blog, Gallery, Home, Newsletter, Person, Social, Work } from "@/types";
import { Line, Logo, Row, Text } from "@once-ui-system/core";

const person: Person = {
  firstName: "Lindor",
  lastName: "Ndiaye",
  name: `Lindor Ndiaye`,
  role: "Développeur PHP, Wordpress",
  avatar: "/images/avatar.jpg",
  email: "Lindoramadou@gmail.com",
  location: "Africa/Dakar", // Expecting the IANA time zone identifier, e.g., 'Europe/Vienna'
  languages: ["Français", "English"], // optional: Leave the array empty if you don't want to display languages
};

const newsletter: Newsletter = {
  display: true,
  title: <>S'abonner à la newsletter de {person.firstName}</>,
  description: <>Ma newsletter hebdomadaire sur la créativité et l'ingénierie</>,
};

const social: Social = [
  // Links are automatically displayed.
  // Import new icons in /once-ui/icons.ts
  {
    name: "WhatsApp",
    icon: "whatsapp",
    link: "https://wa.me/221775893076",
  },
  {
    name: "LinkedIn",
    icon: "linkedin",
    link: "https://www.linkedin.com/in/lindorndiaye/",
  },
  {
    name: "Email",
    icon: "email",
    link: `mailto:${person.email}`,
  },
];

const home: Home = {
  path: "/",
  image: "/images/og/home.jpg",
  label: "Accueil",
  title: `Portfolio de ${person.name}`,
  description: `Site portfolio présentant mon travail en tant que ${person.role}`,
  headline: <>Je transforme vos idées en sites web sur mesure.</>,
  featured: {
    display: true,
    title: (
      <Row gap="12" vertical="center">
        <strong className="ml-4">Une idée ?</strong>{" "}
        <Line background="brand-alpha-strong" vert height="20" />
        <Text marginRight="4" onBackground="brand-medium">
          Écris-moi
        </Text>
      </Row>
    ),
    href: "https://wa.me/221775893076?text=hey%20je%20te%20contact%20depuis%20ton%20site%20lindor.dev",
  },
  subline: (
    <>
      Je suis {person.firstName}, {person.role} passionné par la création
      <br /> d'expériences web sur mesure. Chaque projet que je développe est pensé pour allier design, performance et simplicité d'utilisation.
    </>
  ),
  partners: {
    display: true,
    title: "Partenaires",
    logos: [
      {
        src: "/images/partners/Sonatel.webp",
        alt: "Logo de Sonatel",
      },
      {
        src: "/images/partners/Orange_digital_center.webp",
        alt: "Logo de Orange Digital Center",
      },
      {
        src: "/images/partners/Gsef.webp",
        alt: "Logo de GSEF",
      },
      {
        src: "/images/partners/Socodevi.webp",
        alt: "Logo de SocoDevi",
      },
      {
        src: "/images/partners/Ministere_de_la_sante.webp",
        alt: "Logo de Ministère de la Santé Sénégal",
      },
      {
        src: "/images/partners/Invictus.webp",
        alt: "Logo de Invictus",
      },
      {
        src: "/images/partners/Holding_Fallou_Export.webp",
        alt: "Logo de Holding Fallou Export",
      },
      {
        src: "/images/partners/Domus.webp",
        alt: "Logo de Domus",
      },
      {
        src: "/images/partners/Soubatech.webp",
        alt: "Logo de Soubatech",
      },
      {
        src: "/images/partners/Seven_Design.webp",
        alt: "Logo de Seven Design",
      },
    ],
  },
};

const about: About = {
  path: "/a-propos",
  label: "À propos",
  title: `À propos – ${person.name}`,
  description: `Rencontrez ${person.name}, ${person.role} de ${person.location}`,
  tableOfContent: {
    display: true,
    subItems: false,
  },
  avatar: {
    display: true,
  },
  calendar: {
    display: true,
    link: "https://wa.me/221775893076?text=Bonjour%20!%20Je%20te%20contacte%20depuis%20ton%20site%20lindor.dev.%20Peux-tu%20me%20dire%20quand%20tu%20serais%20disponible%20pour%20un%20appel%20%3F",
  },
  intro: {
    display: true,
    title: "Introduction",
    description: (
      <>
        Je suis {person.name} ,{person.role} spécialisé dans la création de sites modernes, performants et entièrement personnalisés.
        <br /> J’intègre également des architectures Headless WordPress avec React ou Next.js pour offrir des expériences rapides, scalables et adaptées aux besoins les plus exigeants.
      </>
    ),
  },
  work: {
    display: true, // set to false to hide this section
    title: "Expérience professionnelle",
    experiences: [
      {
        company: "Chenocom",
        timeframe: "Janvier 2025 - Aujourd'hui",
        role: "Développeur PHP, WordPress, (Rabat, Maroc)",
        achievements: [
          <>
            Participation au développement et à la maintenance des sites web de l’entreprise
          </>,
          <>
            Veille au bon fonctionnement technique et à la performance des sites
          </>,
          <>
            Optimisation du référencement naturel (SEO)
          </>,
          <>
            Intervention sur les aspects techniques liés à l’hébergement, la sécurité et les mises à jour
          </>,
        ],
        images: [
          // optional: leave the array empty if you don't want to display images
          {
            src: "/images/entreprises/Logo_chenocom.webp",
            alt: "Logo de Chenocom",
            width: 10,
            height: 10,
          },
        ],
      },
      {
        company: "Auto Dealers Digital",
        timeframe: "Août 2023 - Décembre 2024",
        role: "Développeur PHP, WordPress, (Casablanca, Maroc)",
        achievements: [
          <>
            Responsable du site web de l’entreprise : création, maintenance, optimisation continue
          </>,
          <>
           Intégration de fonctionnalités avancées via ACF, hooks WordPress et scripts JS sur mesure
          </>,
           <>
           Collaboration fluide avec les équipes design, produit et marketing
          </>,
           <>
            Conception de sites clients standardisés, semi-custom et full-custom, selon les besoins et budgets
          </>,
           <>
             Mise en place de bonnes pratiques : performance, SEO, accessibilité et sécurité          </>,
          
        ],
        images: [
          // optional: leave the array empty if you don't want to display images
          {
            src: "/images/entreprises/Logo_add.webp",
            alt: "Logo de Auto Dealers Digital",
            width: 10,
            height: 10,
          },
        ],
      },
      {
        company: "Wintech",
        timeframe: "Novembre 2019 - Aujourd'hui",
        role: "Chef de Projet IT – Lead Développeur, (Dakar, Sénégal)",
        achievements: [
          <>
            Gestion de projets web de A à Z : planning, coordination, qualité
          </>,
          <>
            Personnalisation avancée de thèmes & plugins WordPress
          </>,
          <>
            Développement sur mesure à partir de maquettes Figma
          </>,
          <>
            Formation et encadrement de développeurs juniors
          </>,
          <>
            Suivi client, reporting, amélioration continue des process
          </>,
          <>
            Veille technologique et proposition de solutions innovantes pour optimiser les performances des sites
          </>,
        ],
        images: [
          // optional: leave the array empty if you don't want to display images
          {
            src: "/images/entreprises/Logo_wintech.webp",
            alt: "Logo de Wintech",
            width: 10,
            height: 10,
          },
        ],
      },
    ],
  },
  studies: {
    display: true, // set to false to hide this section
    title: "Études",
    institutions: [
      {
        name: "Udemy",
        description: <>Certification Scrum Master <br></br>Certification Social Media Manager</>,
      },
      {
        name: "Bill Jobs Institute",
        description: <>Licence Pro Informatique de Gestion</>,
      },
      {
        name: "Sonatel Academy",
        description: <>Formation Développement Web et Mobile</>,
      },
    ],
  },
  technical: {
    display: true, // set to false to hide this section
    title: "Compétences techniques",
    skills: [
     
      {
        title: "Langages",
        description: (
          <>Création d’interfaces modernes et responsives avec</>
        ),
        tags: [
          {
            name: "HTML",
            icon: "html",
          },
          {
            name: "CSS",
            icon: "css",
          },
          {
            name: "JavaScript",
            icon: "javascript",
          },
          {
            name: "jQuery",
            icon: "jquery",
          },
          {
            name: "Sass",
            icon: "sass",
          },
          {
            name: "Bootstrap",
            icon: "bootstrap",
          },
        ],
        // optional: leave the array empty if you don't want to display images
        images: [
         
        ],
      },
      { 
        title: "Back-end & API",
        description: (
          <>Développement back-end robuste, gestion de bases de données et intégration d’APIs REST.</>
        ),
        tags: [
          {
            name: "PHP",
            icon: "php",
          },
          {
            name: "MySQL",
            icon: "mysql",
          },
          {
            name: "API REST",
            icon: "api",
          },
          {
            name: "WP GraphQL",
            icon: "wp-graphql",
          },
         
        ],
        // optional: leave the array empty if you don't want to display images
        images: [
         
        ],
      },
      { 
        title: "CMS & Frameworks",
        description: (
          <>Expert WordPress, conception de sites sur-mesure et Headless WordPress avec React.js / Next.js.</>
        ),
        tags: [
          {
            name: "WordPress",
            icon: "wordpress",
          },
          {
            name: "Gutenberg",
            icon: "gutenberg",
          },
          {
            name: "ACF",
            icon: "acf",
          },
          {
            name: "WooCommerce",
            icon: "woocommerce",
          },
          {
            name: "Elementor",
            icon: "elementor",
          },
          {
            name: "Yoast",
            icon: "yoast",
          },
          {
            name: "React.js",
            icon: "react",
          },
          {
            name: "Next.js",
            icon: "nextjs",
          },
          {
            name: "Gatsby",
            icon: "gatsby",
          },
          
        
        ],
        // optional: leave the array empty if you don't want to display images
        images: [
         
        ],
      },
      {
        title: "Gestion de projet & Outils",
        description: (
          <>Méthodologies Agile/Scrum, suivi de projet et déploiement.</>
        ),
        tags: [
          {
            name: "Git",
            icon: "git",
          },
          {
            name: "GitHub",
            icon: "github",
          },
          {
            name: "GitLab",
            icon: "gitlab",
          },
          {
            name: "Docker",
            icon: "docker",
          },
          {
            name: "Trello",
            icon: "trello",
          },  
          {
            name: "Vercel",
            icon: "vercel",
          },
           
        ],
        // optional: leave the array empty if you don't want to display images
        images: [
       
        ],
      },  
    ],
  },
  partners: {
    display: true,
    title: "Ils m'ont fait confiance",
    logos: [
      {
        src: "/images/partners/Sonatel.webp",
        alt: "Logo de Sonatel",
      },
      {
        src: "/images/partners/Orange_digital_center.webp",
        alt: "Logo de Orange Digital Center",
      },
      {
        src: "/images/partners/Gsef.webp",
        alt: "Logo de GSEF",
      },
      {
        src: "/images/partners/Socodevi.webp",
        alt: "Logo de SocoDevi",
      },
      {
        src: "/images/partners/Ministere_de_la_sante.webp",
        alt: "Logo de Ministère de la Santé Sénégal",
      },
      {
        src: "/images/partners/Invictus.webp",
        alt: "Logo de Invictus",
      },
      {
        src: "/images/partners/Holding_Fallou_Export.webp",
        alt: "Logo de Holding Fallou Export",
      },
      {
        src: "/images/partners/Domus.webp",
        alt: "Logo de Domus",
      },
      {
        src: "/images/partners/Soubatech.webp",
        alt: "Logo de Soubatech",
      },
      {
        src: "/images/partners/Seven_Design.webp",
        alt: "Logo de Seven Design",
      },
    ],
  },
};

const blog: Blog = {
  path: "/blog",
  label: "Blog",
  title: "Écrits sur le design et la tech...",
  description: `Découvrez ce sur quoi ${person.name} a travaillé récemment`,
  // Create new blog posts by adding a new .mdx file to app/blog/posts
  // All posts will be listed on the /blog route
};

const work: Work = {
  path: "/projets",
  label: "Projets",
  title: `Projets – ${person.name}`,
  description: `Projets de design et développement par ${person.name}`,
  // Create new project pages by adding a new .mdx file to app/blog/posts
  // All projects will be listed on the /home and /work routes
};

const gallery: Gallery = {
  path: "/galerie",
  label: "Galerie",
  title: `Galerie photo – ${person.name}`,
  description: `Une collection de photos par ${person.name}`,
  // Images by https://lorant.one
  // These are placeholder images, replace with your own
  images: [
    {
      src: "/images/gallery/horizontal-1.jpg",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/vertical-4.jpg",
      alt: "image",
      orientation: "vertical",
    },
    {
      src: "/images/gallery/horizontal-3.jpg",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/vertical-1.jpg",
      alt: "image",
      orientation: "vertical",
    },
    {
      src: "/images/gallery/vertical-2.jpg",
      alt: "image",
      orientation: "vertical",
    },
    {
      src: "/images/gallery/horizontal-2.jpg",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/horizontal-4.jpg",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/vertical-3.jpg",
      alt: "image",
      orientation: "vertical",
    },
  ],
};

export { person, social, newsletter, home, about, blog, work, gallery };
