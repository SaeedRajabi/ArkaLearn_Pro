'use client';

import { DesktopAppReleasesForm } from './components/desktop-app-releases-form';
import { DesktopDevicesForm } from './components/desktop-devices-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/components/language-provider';

export default function DesktopAppSettingsPage() {
  const { t , direction } = useLanguage();

  return (
    <div className="space-y-4 p-4">
      <Tabs dir={direction} defaultValue="releases">
        <TabsList>
          <TabsTrigger value="releases">{t('desktop_tab_releases')}</TabsTrigger>
          <TabsTrigger value="devices">{t('desktop_tab_devices')}</TabsTrigger>
        </TabsList>
        <TabsContent value="releases" className="mt-4">
          <DesktopAppReleasesForm />
        </TabsContent>
        <TabsContent value="devices" className="mt-4">
          <DesktopDevicesForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
