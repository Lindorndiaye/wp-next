"use client";

import { Column, Grid, Heading } from "@once-ui-system/core";
import styles from "./PartnersGrid.module.scss";

interface PartnerLogo {
  src: string;
  alt: string;
  href?: string;
}

interface PartnersGridProps {
  title?: string;
  logos: PartnerLogo[];
}

export function PartnersGrid({ title, logos }: PartnersGridProps) {
  return (
    <Column fillWidth gap="m" paddingY="l">
      {title && (
        <Heading as="h2" id={title} variant="display-strong-s" marginBottom="m">
          {title}
        </Heading>
      )}
      <Grid
        fillWidth
        columns="5"
        s={{ columns: "3" }}
        xs={{ columns: "3", gap: "xs" }}
        gap="s"
      >
        {logos.map((logo, index) => (
          <Column
            key={index}
            className={`${styles.logoWrapper} ${index >= 9 ? styles.hideOnMobile : ''}`}
            horizontal="center"
            vertical="center"
          >
            <img
              src={logo.src}
              alt={logo.alt}
              className={styles.logo}
              draggable={false}
            />
          </Column>
        ))}
      </Grid>
    </Column>
  );
}

