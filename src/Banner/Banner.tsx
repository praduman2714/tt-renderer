"use client";

import React, { FunctionComponent, InputHTMLAttributes } from "react";
import { Button, ButtonSize } from "@tradetrust-tt/tradetrust-ui-components";
import Link from "next/link";

interface BannerProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  title: string;
  buttonText: string;
  to: string;
  absolute?: boolean;
}

export const Banner: FunctionComponent<BannerProps> = ({
  className,
  title,
  buttonText,
  to,
  absolute = false,
}) => {
  const button = (
    <Button className="bg-tangerine-500 text-white hover:bg-tangerine-800 border-none" size={ButtonSize.LG}>
      <h4>{buttonText}</h4>
    </Button>
  );

  return (
    <div className={className ?? ""}>
      <div className="container">
        <div className="rounded-xl bg-cerulean-500 bg-cover bg-wave-lines-light">
          <div className="flex flex-wrap items-center px-4 py-6 text-white">
            <div className="px-2 w-full lg:w-2/3 mb-2 lg:mb-0">
              <h3 data-testid="banner-title">{title}</h3>
            </div>
            <div className="px-2 w-auto lg:ml-auto">
              {absolute ? (
                <a href={to} target="_blank" rel="noopener noreferrer">
                  {button}
                </a>
              ) : (
                <Link href={to}>{button}</Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
