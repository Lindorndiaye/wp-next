import { IconType } from "react-icons";

import {
  HiArrowUpRight,
  HiOutlineLink,
  HiArrowTopRightOnSquare,
  HiEnvelope,
  HiCalendarDays,
  HiArrowRight,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineDocument,
  HiOutlineGlobeAsiaAustralia,
  HiOutlineRocketLaunch,
} from "react-icons/hi2";

import {
  PiHouseDuotone,
  PiUserCircleDuotone,
  PiGridFourDuotone,
  PiBookBookmarkDuotone,
  PiImageDuotone,
} from "react-icons/pi";

import {
  SiJavascript,
  SiNextdotjs,
  SiFigma,
  SiSupabase,
  SiWordpress,
  SiWoocommerce,
  SiElementor,
  SiYoast,
  SiHtml5,
  SiCss3,
  SiJquery,
  SiPhp,
  SiMysql,
  SiGraphql,
  SiSass,
  SiBootstrap,
  SiReact,
  SiGatsby,
  SiGit,
  SiGitlab,
  SiDocker,
  SiTrello,
  SiVercel,
} from "react-icons/si";

import { FaDiscord, FaGithub, FaLinkedin, FaX, FaThreads, FaXTwitter, FaFacebook, FaPinterest, FaWhatsapp, FaReddit, FaTelegram, } from "react-icons/fa6";

export const iconLibrary: Record<string, IconType> = {
  arrowUpRight: HiArrowUpRight,
  arrowRight: HiArrowRight,
  email: HiEnvelope,
  globe: HiOutlineGlobeAsiaAustralia,
  person: PiUserCircleDuotone,
  grid: PiGridFourDuotone,
  book: PiBookBookmarkDuotone,
  openLink: HiOutlineLink,
  calendar: HiCalendarDays,
  home: PiHouseDuotone,
  gallery: PiImageDuotone,
  discord: FaDiscord,
  eye: HiOutlineEye,
  eyeOff: HiOutlineEyeSlash,
  github: FaGithub,
  linkedin: FaLinkedin,
  x: FaX,
  twitter: FaXTwitter,
  threads: FaThreads,
  arrowUpRightFromSquare: HiArrowTopRightOnSquare,
  document: HiOutlineDocument,
  rocket: HiOutlineRocketLaunch,
  javascript: SiJavascript,
  supabase: SiSupabase,
  figma: SiFigma,
  facebook: FaFacebook,
  pinterest: FaPinterest,
  whatsapp: FaWhatsapp,
  reddit: FaReddit,
  telegram: FaTelegram,
  // Technologies web
  html: SiHtml5,
  css: SiCss3,
  jquery: SiJquery,
  sass: SiSass,
  bootstrap: SiBootstrap,
  php: SiPhp,
  mysql: SiMysql,
  // WordPress & CMS
  wordpress: SiWordpress,
  woocommerce: SiWoocommerce,
  elementor: SiElementor,
  yoast: SiYoast,
  // Frameworks JavaScript
  react: SiReact,
  nextjs: SiNextdotjs,
  gatsby: SiGatsby,
  // GraphQL
  "wp-graphql": SiGraphql,
  // API (utiliser une icône générique)
  api: HiOutlineGlobeAsiaAustralia,
  // Gutenberg et ACF n'ont pas d'icônes dans react-icons, utiliser des icônes génériques
  gutenberg: HiOutlineDocument,
  acf: HiOutlineDocument,
  // Outils de développement
  git: SiGit,
  gitlab: SiGitlab,
  docker: SiDocker,
  // Outils de gestion de projet
  trello: SiTrello,
  vercel: SiVercel,
};

export type IconLibrary = typeof iconLibrary;
export type IconName = keyof IconLibrary;
