// Standard section/container classes to keep content inside the viewport.
export const pageLayout = {
  shell: 'w-full max-w-full overflow-x-clip',
  /** Top page band with title + breadcrumb (matches site-wide #F5F5F5). */
  pageHeaderBand: 'w-full bg-[#cecece]',
  container: 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8',
  sectionSpace: 'py-12 sm:py-16 lg:py-24',
  sectionSpaceTight: 'py-10 sm:py-12 lg:py-16',
  sectionContainer:
    'mx-auto w-full max-w-7xl overflow-x-clip px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24',
  sectionContainerTight:
    'mx-auto w-full max-w-7xl overflow-x-clip px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16',
} as const;
