'use client';

import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';

export default function PageProgressBar() {
  return (
    <ProgressBar
      height="4px"
      color="hsl(0 84.2% 60.2%)"
      options={{ showSpinner: false }}
      // shallowRouting رو فقط وقتی واقعاً shallow routing داری روشن کن
      // shallowRouting
      delay={100}
    />
  );
}