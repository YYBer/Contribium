import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import React, { type ReactNode, useEffect, useState } from 'react';

import { type Superteams } from '@/constants/Contribium';
import { HomeBanner, NavTabs, UserStatsBanner } from '@/features/home';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { cn } from '@/utils';

interface HomeProps {
  children: ReactNode;
  type: 'landing' | 'listing' | 'category' | 'region' | 'niche' | 'feed';
  st?: (typeof Superteams)[0];
  isAuth?: boolean;
}

type CategoryTypes = 'content' | 'development' | 'design' | 'other';

const RegionBanner = dynamic(() =>
  import('@/features/home').then((mod) => mod.RegionBanner),
);

const CategoryBanner = dynamic(() =>
  import('@/features/home').then((mod) => mod.CategoryBanner),
);

const HomeSideBar = dynamic(() =>
  import('@/features/home').then((mod) => mod.HomeSideBar),
);

export function Home({ children, type, st, isAuth }: HomeProps) {
  const router = useRouter();
  const [currentCategory, setCurrentCategory] = useState<CategoryTypes | null>(
    null,
  );

  useEffect(() => {
    if (router.asPath.includes('/category/development/')) {
      setCurrentCategory('development');
    } else if (router.asPath.includes('/category/design/')) {
      setCurrentCategory('design');
    } else if (router.asPath.includes('/category/content/')) {
      setCurrentCategory('content');
    } else if (router.asPath.includes('/category/other/')) {
      setCurrentCategory('other');
    }
  }, [router.asPath]);

  const { data: session, status } = useSession();

  return (
    <Default
      className="bg-white"
      meta={
        <Meta
          title="Alephium | Work to Earn in Crypto"
          description="Explore the latest bounties on Alephium, offering opportunities in the crypto space across Design, Development, and Content."
          canonical="https://contribium"
        />
      }
    >
      {type === 'region' && st && <RegionBanner st={st} />}
      {type === 'category' && currentCategory && (
        <CategoryBanner category={currentCategory} />
      )}
      <div className="mx-auto w-full px-2 lg:px-6">
        <div className="mx-auto w-full max-w-7xl p-0">
          <div className="flex items-start justify-between">
            <div
              className={cn(
                'w-full py-4',
                type !== 'niche' && 'lg:border-r lg:border-slate-100',
              )}
            >
              <div className="w-full pt-1 lg:pr-6">
                {type === 'landing' && (
                  <>
                    <NavTabs />
                    {isAuth ? <UserStatsBanner /> : <HomeBanner />}
                  </>
                )}
                {type === 'listing' && (
                  <>
                    <NavTabs />
                    {!session && status === 'unauthenticated' ? (
                      <HomeBanner />
                    ) : (
                      <UserStatsBanner />
                    )}
                  </>
                )}
                {type === 'category' && <NavTabs />}
                {type === 'region' && <NavTabs className="mt-1" />}
                {children}
              </div>
            </div>

            {type !== 'niche' && (
              <div className="hidden lg:flex">
                <HomeSideBar type={type} />
              </div>
            )}
          </div>
        </div>
      </div>
    </Default>
  );
}
