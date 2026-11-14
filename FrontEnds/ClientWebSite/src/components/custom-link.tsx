
'use client';

import Link, { type LinkProps } from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect } from 'react';
import {useLoading} from "@/contexts/language-context";

type CustomLinkProps = LinkProps & {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
};

export function CustomLink({ children, onClick, ...props }: CustomLinkProps) {
  const { setIsLoading } = useLoading();
  const pathname = usePathname();

  useEffect(() => {
    setIsLoading(false);
  }, [pathname, setIsLoading]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e);
    }
    // Check if it's a normal navigation click (not ctrl/cmd click, etc.)
    if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
      if (props.href.toString() !== pathname) {
        setIsLoading(true);
      }
    }
  };

  return (
    <Link {...props} onClick={handleClick}>
      {children}
    </Link>
  );
}
