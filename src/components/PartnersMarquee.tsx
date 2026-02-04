"use client";

import { Column } from "@once-ui-system/core";
import styles from "./PartnersMarquee.module.scss";

interface PartnerLogo {
  src: string;
  alt: string;
  href?: string;
}

interface PartnersMarqueeProps {
  title?: React.ReactNode;
  logos: PartnerLogo[];
}

export function PartnersMarquee({ title, logos }: PartnersMarqueeProps) {
  // Duplicate logos multiple times for seamless infinite scroll
  const duplicatedLogos = [...logos, ...logos, ...logos];

  return (
    <Column fillWidth gap="m" paddingY="m">
      <div className={styles.container}>
        <div className={styles.scroll}>
          {duplicatedLogos.map((logo, index) => (
            <div key={index} className={styles.logoWrapper}>
              <img
                src={logo.src}
                alt={logo.alt}
                className={styles.logo}
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>
    </Column>
  );
}

