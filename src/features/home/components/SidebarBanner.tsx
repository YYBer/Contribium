import NextLink from 'next/link';

import { Button } from '@/components/ui/button';
import { RadarLogo } from '@/svg/radar-logo';

export const SidebarBanner = () => {
  return (
    <div
      className="flex h-max w-full flex-col gap-1 rounded-lg bg-cover bg-center bg-no-repeat px-6 py-8"
      style={{
        backgroundImage: "url('/assets/hackathon/radar/sidebar-bg.webp')",
      }}
    >
      <div className="flex items-center">
        <RadarLogo
          styles={{
            width: '100%',
            marginLeft: 'auto',
            marginRight: 'auto',
            marginBottom: '8px',
          }}
        />
      </div>
      <p className="text-lg font-semibold text-white opacity-90">
        Build a project for the latest Solana global hackathon!
      </p>
      <p className="mt-2 text-base leading-[1.1875rem] text-orange-100">
        Submit to any of the Radar Side Tracks on Contribium, and stand to win from a
        pool of $250k+. Deadline for submissions is October 9, 2024 (UTC).
      </p>
      <NextLink href="/hackathon/radar" className="mt-6">
        <Button
          className="w-full rounded-lg bg-white py-6 text-[0.9rem] font-semibold text-black hover:bg-orange-100"
          variant="ghost"
        >
          View Tracks
        </Button>
      </NextLink>
    </div>
  );
};
