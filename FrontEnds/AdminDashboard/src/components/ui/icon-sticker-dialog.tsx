
'use client';

import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '../language-provider';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';

const emojiCategories = {
  "Smileys & Emotion": ["😀", "😁", "😂", "🤣", "😃", "😄", "😅", "😆", "😉", "😊", "😋", "😎", "😍", "😘", "🥰", "😗", "😙", "🥲", "🤔", "🤩", "🤗", "🙂", "🤨", "😐", "😑", "😶", "🫥", "😮", "😥", "😣", "😏", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "😵‍💫", "🤯", "🤠", "🥳", "✨", "🥺", "🔹", "🙁", "☹️", "😟", "😕", "😲", "😳", "🤪", "😠", "😡", "🤬", "😭", "😤", "😇", "🤫", "💀", "💩", "🤡", "👹", "👺", "👻", "👽", "👾", "🤖", "❤️‍🔥", "❤️", "🧡", "💛", "💚", "💙", "💜", "🤎", "🖤", "🤍", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "❤️‍🩹"],
  "People & Body": ["👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "🫶", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦵", "🦿", "🦶", "👂", "🦻", "👃", "🧠", "✅", "❌", "🦷", "🦴", "👀", "👁️", "👅", "👄", "🔒", "👶", "👧", "🧒", "👦", "👩", "🧑", "👨", "👩‍🦱", "🧑‍🦱", "👨‍🦱", "👩‍🦰", "🧑‍🦰", "👨‍🦰", "👱‍♀️", "👱", "👱‍♂️", "👩‍🦳", "🧑‍🦳", "👨‍🦳", "👩‍🦲", "🧑‍🦲", "👨‍🦲", "🧔‍♀️", "🧔", "🧔‍♂️", "👵", "🧓", "👴", "👲", "🧕", "👳‍♀️", "👳", "👳‍♂️", "👮‍♀️", "👮", "👮‍♂️", "👷‍♀️", "👷", "👷‍♂️", "💂‍♀️", "💂", "💂‍♂️", "🕵️‍♀️", "🕵️", "🕵️‍♂️", "👩‍⚕️", "🧑‍⚕️", "👨‍⚕️", "👩‍🌾", "🧑‍🌾", "👨‍🌾", "👩‍🍳", "🧑‍🍳", "👨‍🍳", "👩‍🎓", "🧑‍🎓", "👨‍🎓", "👩‍🎤", "🧑‍🎤", "👨‍🎤", "👩‍🏫", "🧑‍🏫", "👨‍🏫", "👩‍🏭", "🧑‍🏭", "👨‍🏭", "👩‍💻", "🧑‍💻", "👨‍💻", "👩‍💼", "🧑‍💼", "👨‍💼", "👩‍🔧", "🧑‍🔧", "👨‍🔧", "👩‍🔬", "🧑‍🔬", "👨‍🔬", "👩‍🎨", "🧑‍🎨", "👨‍🎨", "👩‍🚒", "🧑‍🚒", "👨‍🚒", "👩‍✈️", "🧑‍✈️", "👨‍✈️", "👩‍🚀", "🧑‍🚀", "👨‍🚀", "👩‍⚖️", "🧑‍⚖️", "👨‍⚖️", "👰‍♀️", "👰", "👰‍♂️", "🤵‍♀️", "🤵", "🤵‍♂️", "🥷", "🦸‍♀️", "🦸", "🦸‍♂️", "🦹‍♀️", "🦹", "🦹‍♂️", "🧙‍♀️", "🧙", "🧙‍♂️", "🧚‍♀️", "🧚", "🧚‍♂️", "🧛‍♀️", "🧛", "🧛‍♂️", "🧜‍♀️", "🧜", "🧜‍♂️", "🧝‍♀️", "🧝", "🧝‍♂️", "🧞‍♀️", "🧞", "🧞‍♂️", "🧟‍♀️", "🧟", "🧟‍♂️", "🧌", "💆‍♀️", "💆", "💆‍♂️", "💇‍♀️", "💇", "💇‍♂️", "🚶‍♀️", "🚶", "🚶‍♂️", "🧍‍♀️", "🧍", "🧍‍♂️", "🧎‍♀️", "🧎", "🧎‍♂️", "👩‍🦽", "🧑‍🦽", "👨‍🦽", "👩‍🦼", "🧑‍🦼", "👨‍🦼", "👩‍🦯", "🧑‍🦯", "👨‍🦯", "🧏‍♀️", "🧏", "🧏‍♂️", "🏃‍♀️", "🏃", "🏃‍♂️", "💃", "🕺", "🧗‍♀️", "🧗", "🧗‍♂️", "🏇", "⛷️", "🏂", "🏌️‍♀️", "🏌️", "🏌️‍♂️", "🏄‍♀️", "🏄", "🏄‍♂️", "🚣‍♀️", "🚣", "🚣‍♂️", "🏊‍♀️", "🏊", "🏊‍♂️", "⛹️‍♀️", "⛹️", "⛹️‍♂️", "🏋️‍♀️", "🏋️", "🏋️‍♂️", "🚴‍♀️", "🚴", "🚴‍♂️", "🚵‍♀️", "🚵", "🚵‍♂️", "🤸‍♀️", "🤸", "🤸‍♂️", "🤼‍♀️", "🤼", "🤼‍♂️", "🤽‍♀️", "🤽", "🤽‍♂️", "🤾‍♀️", "🤾", "🤾‍♂️", "🤹‍♀️", "🤹", "🤹‍♂️", "🧘‍♀️", "🧘", "🧘‍♂️", "🛀", "🛌", "🗣️", "👤", "👥", "🫂"],
  "Animals & Nature": ["🙈", "🙉", "🙊", "🐵", "🐒", "🦍", "🦧", "🐶", "🐕", "🦮", "🐕‍🦺", "🐩", "🐺", "🦊", "🦝", "🐱", "🐈", "🐈‍⬛", "🦁", "🐯", "🐅", "🐆", "🐴", "🫎", "🫏", "🦄", "🦓", "🦌", "🦬", "🐮", "🐂", "🐃", "🐄", "🐷", "🐖", "🐗", "🐽", "🐏", "🐑", "🐐", "🐪", "🐫", "🦙", "🦒", "🐘", "🦣", "🦏", "🦛", "🐭", "🐁", "🐀", "🐹", "🐰", "🐇", "🐿️", "🔧", "🦔", "🦇", "🐻", "🐻‍❄️", "🐨", "🐼", "🦥", "🦦", "🦨", "🦘", "🦡", "🐾", "🦃", "🐔", "🐓", "🐣", "🐤", "🐥", "🐦", "🐧", "🕊️", "🦅", "🦆", "🦢", "🦉", "🦤", "🪶", "🦩", "🦚", "🦜", "🐸", "🐊", "🐢", "🦎", "🐍", "🐲", "🐉", "🦕", "🦖", "🐳", "🐋", "🐬", "🦭", "🐟", "🐠", "🐡", "🦈", "🐙", "🐚", "🪸", "🐌", "🦋", "🐛", "🐜", "🐝", "🪲", "🐞", "🦗", "🪳", "🕷️", "🕸️", "🦂", "🦟", "🪰", "🪱", "🦠", "💐", "🌸", "💮", "🪷", "🏵️", "🌹", "🥀", "🌺", "🌻", "🌼", "🌷", "🌱", "🪴", "🌲", "🌳", "🌴", "🌵", "🌾", "🌿", "☘️", "🍀", "🍁", "🍂", "🍃"],
  "Food & Drink": ["🍇", "🍈", "🍉", "🍊", "🍋", "🍌", "🍍", "🥭", "🍎", "🍏", "🍐", "🍑", "🍒", "🍓", "🫐", "🥝", "🍅", "🫒", "🥥", "🥑", "🍆", "🥔", "🥕", "🌽", "🌶️", "🫑", "🥒", "🥬", "🥦", "🧄", "🧅", "🍄", "🥜", "🫘", "🌰", "🍞", "🥐", "🥖", "🫓", "🥨", "🥯", "🥞", "🧀", "🍖", "🍗", "🥩", "🥓", "🍔", "🍟", "🍕", "🌭", "🥪", "🌮", "🌯", "🫔", "🥙", "🧆", "🥚", "🍳", "🥘", "🍲", "🫕", "🥣", "🥗", "🍿", "🧈", "🧂", "🥫", "🍱", "🍘", "🍙", "🍚", "🍛", "🍜", "🍝", "🍠", "🍢", "🍣", "🍤", "🍥", "🥮", "🍡", "🥟", "🥠", "🥡", "🦀", "🦐", "🦑", "🦪", "🍦", "🍧", "🍨", "🍩", "🍪", "🎂", "🍰", "🧁", "🥧", "🍫", "🍬", "🍭", "🍮", "🍯", "🍼", "🥛", "☕", "🫖", "🍵", "🍶", "🍾", "🍷", "🍸", "🍹", "🍺", "🍻", "🥂", "🥃", "🫗", "🥤", "🧃", "🧉", "🧊", "🥢", "🍽️", "🍴", "🥄", "🔪", "🫙", "🏺"],
  "Travel & Places": ["🧭", "🧱", "🪨", "🪵", "🛖", "🏘️", "🏚️", "🏠", "🏡", "🏢", "🏣", "🏤", "🏥", "🏦", "🏨", "🏩", "🏪", "🏫", "🏬", "🏭", "🏯", "🏰", "💒", "🗼", "🗽", "⛪", "🕌", "🛕", "🕍", "⛩️", "🕋", "⛲", "⛺", "🌁", "🌃", "🏙️", "🌄", "🌅", "🌆", "🌇", "🌉", "♨️", "🎠", "🛝", "🎡", "🎢", "💈", "🚂", "🚃", "🚄", "🚅", "🚆", "🚇", "🚈", "🚉", "🚊", "🚝", "🚞", "🚋", "🚌", "🚍", "🚎", "🚐", "🚑", "🚒", "🚓", "🚔", "🚕", "🚖", "🚗", "🚘", "🚙", "🛻", "🚚", "🚛", "🚜", "🏎️", "🏍️", "🛵", "🦽", "🦼", "🛺", "🚲", "🛴", "🛹", "🛼", "🚏", "🛣️", "🛤️", "🛢️", "⛽", "🛞", "🚨", "🚥", "🚦", "🛑", "🚧", "⚓", "🛟", "⛵", "🛶", "🚤", "🛳️", "⛴️", "🛥️", "🚢", "✈️", "🛩️", "🛫", "🛬", "🪂", "💺", "🚁", "🚟", "🚠", "🚡", "🛰️", "🚀", "🛸"]
};


interface IconStickerMenuProps {
  onIconSelectAction: (iconName: string) => void;
  onEmojiSelectAction: (emoji: string) => void;
}

export function IconStickerMenu({ onIconSelectAction, onEmojiSelectAction }: IconStickerMenuProps) {
  const { t } = useLanguage();
  const [iconSearchTerm, setIconSearchTerm] = useState('');
  const stickerCategoryLabels: Record<string, string> = {
    'Smileys & Emotion': t('icon_sticker_category_smileys_emotion'),
    'People & Body': t('icon_sticker_category_people_body'),
    'Animals & Nature': t('icon_sticker_category_animals_nature'),
    'Food & Drink': t('icon_sticker_category_food_drink'),
    'Travel & Places': t('icon_sticker_category_travel_places'),
  };
  const iconMap = LucideIcons as Record<string, any>;
  const allIcons = useMemo(
    () =>
      Object.entries(iconMap)
        .filter(([, IconComponent]) => typeof IconComponent === 'function' && Array.isArray((IconComponent as any).iconNode))
        .map(([iconName]) => iconName)
        .sort(),
    []
  );

  const filteredIcons = useMemo(() => {
    if (!allIcons) return [];
    if (!iconSearchTerm) return allIcons;
    return allIcons.filter(iconName =>
      iconName.toLowerCase().includes(iconSearchTerm.toLowerCase())
    );
  }, [iconSearchTerm, allIcons]);

  return (
    <div className="w-[360px]">
      <Tabs defaultValue="icons" className="flex flex-col gap-2">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="icons">{t('icon_sticker_icons_tab')}</TabsTrigger>
          <TabsTrigger value="stickers">{t('icon_sticker_stickers_tab')}</TabsTrigger>
        </TabsList>
        <TabsContent value="icons" className="mt-0">
          <div className="pb-2">
            <Input
              placeholder={t('icon_sticker_search_placeholder')}
              value={iconSearchTerm}
              onChange={(e) => setIconSearchTerm(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <ScrollArea className="h-[260px] pr-2">
            <div className="grid grid-cols-6 gap-2">
              {filteredIcons.length === 0 && (
                <p className="col-span-6 text-xs text-muted-foreground">{t('icon_sticker_no_icons')}</p>
              )}
              {filteredIcons.map((iconName) => {
                const IconComponent = (LucideIcons as any)[iconName];
                if (!IconComponent) return null;
                return (
                  <Button
                    key={iconName}
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    title={iconName}
                    onClick={() => onIconSelectAction(iconName)}
                  >
                    <IconComponent className="h-5 w-5" />
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="stickers" className="mt-0">
          <ScrollArea className="h-[260px] pr-2">
            {Object.entries(emojiCategories).map(([category, emojis]) => (
              <div key={category} className="mb-3">
                <h3 className="text-xs font-medium text-muted-foreground mb-2">
                  {stickerCategoryLabels[category] || category}
                </h3>
                <div className="grid grid-cols-8 gap-1">
                  {emojis.map((emoji) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      className="text-xl h-9 w-9 p-0"
                      onClick={() => onEmojiSelectAction(emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    
