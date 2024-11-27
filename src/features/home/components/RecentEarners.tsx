import NextLink from 'next/link';
import { usePostHog } from 'posthog-js/react';
import React, { useEffect, useRef, useState } from 'react';
import { MdArrowForward } from 'react-icons/md';

import { tokenList } from '@/constants';
import { ContribiumAvatar } from '@/features/talent';
import { type User } from '@/interface/user';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { getURL } from '@/utils/validUrl';

interface ContribiumerProps {
  name: string;
  avatar?: string;
  amount: number;
  bounty?: string;
  token?: string;
  username: string;
  id: string;
}

const Contribiumer = ({
  amount,
  name,
  avatar,
  bounty,
  token,
  username,
  id,
}: ContribiumerProps) => {
  const tokenObj = tokenList.find((t) => t.tokenSymbol === token);
  const tokenIcon = tokenObj
    ? tokenObj.icon
    : '/assets/landingsponsor/icons/usdc.svg';

  return (
    <NextLink href={`${getURL()}t/${username}`} className="block">
      <div className="my-4 flex w-full items-center">
        <div className="mr-3 flex items-center justify-center">
          <ContribiumAvatar id={id} avatar={avatar} />
        </div>
        <div className="w-[13.8rem]">
          <p className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-black">
            {name}
          </p>
          <p className="overflow-hidden text-ellipsis whitespace-nowrap text-xs font-medium text-gray-400">
            {bounty}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <img
            className="h-5 w-5 rounded-full"
            alt={`${token} icon`}
            src={tokenIcon}
          />
          <span className="text-sm font-medium text-gray-600">
            {formatNumberWithSuffix(amount)}
          </span>
          <span className="text-sm font-medium text-gray-400">{token}</span>
        </div>
      </div>
    </NextLink>
  );
};

export const RecentContribiumers = ({ Contribiumers }: { Contribiumers?: User[] }) => {
  const marqueeRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const posthog = usePostHog();

  const multipliedContribiumers = Contribiumers ? [...Contribiumers, ...Contribiumers, ...Contribiumers] : [];

  const animate = () => {
    const marquee = marqueeRef.current;
    if (marquee && !isPaused) {
      if (marquee.scrollHeight - marquee.scrollTop <= marquee.clientHeight) {
        marquee.scrollTop -= marquee.scrollHeight / 3;
      } else {
        marquee.scrollTop += 1;
      }
    }
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPaused]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-400">
          RECENT ContribiumERS
        </span>
        <NextLink
          href="/leaderboard"
          className="ph-no-capture flex items-center text-xs font-semibold text-brand-purple"
          onClick={() => {
            posthog.capture('view leaderboard_homepage');
          }}
        >
          Leaderboard
          <MdArrowForward className="ml-1" />
        </NextLink>
      </div>
      <div className="flex flex-col">
        <div
          ref={marqueeRef}
          className="h-[300px] overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {multipliedContribiumers.map((t: any, index: number) => (
            <Contribiumer
              key={`${t.id}-${index}`}
              amount={t.reward ?? 0}
              token={t.rewardToken}
              name={`${t.firstName} ${t.lastName}`}
              username={t.username}
              avatar={t.photo}
              bounty={t.title ?? ''}
              id={t.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
