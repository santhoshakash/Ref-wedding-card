'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useId,
} from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Calendar,
  MapPin,
  Check,
  Copy,
  X,
  ChevronLeft,
  ChevronRight,
  VolumeX,
  Volume2,
} from 'lucide-react';

/* =====================================================================
   PALETTE
   ===================================================================== */

const GOLD = '#D4AF37';

const SCRIPT = 'font-editorial';
const HEAD = 'font-clean-sans';
const C = 'font-clean-sans';
const D = 'font-garamond';
const T = 'font-tamil';

/*
  REAL TEMPLE PHOTOS (one slot per section)
  1. Save your photos in /public/images/temple/  (JPG or WebP, about 1600px wide, under 300 KB)
  2. Fill in the paths below, for example: hero: '/images/temple/gopuram.jpg'
  Each photo is toned sepia, faded at the top and bottom, and shown at low opacity so the
  red and gold theme and the text stay readable. An empty slot keeps the built-in line-art.
  To use one photo everywhere: const ONE = '/images/temple/temple.jpg' and set every slot to ONE.
*/
const TEMPLE_PHOTOS: Record<string, string> = {
  entrance: '', // glows behind the doors when they open
  hero: '',
  'envelope-invitation': '',
  location: '',
  about: '',
  gallery: '',
  'interactive-join': '',
  blessings: '',
};

/* ---------- repeating patterns (inline SVG, no files needed) ---------- */

const templeSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='18' viewBox='0 0 28 18'><rect width='28' height='18' fill='#7A0A1A'/><path d='M0 18 L14 2 L28 18Z' fill='#D4AF37'/><path d='M5 18 L14 7 L23 18Z' fill='#42050E'/><path d='M10 18 L14 12 L18 18Z' fill='#FFE8A3'/><rect width='28' height='1.5' fill='#FFE8A3'/></svg>`;
const TEMPLE_BORDER = `url("data:image/svg+xml,${encodeURIComponent(templeSvg)}")`;

/* Kolam-style tile: four petals around a centre dot, with corner dots (pulli) */
const kolamTile = (color: string, op: number) => {
  const petal = `d='M36 10 C44 20 44 28 36 36 C28 28 28 20 36 10Z'`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='72' height='72' viewBox='0 0 72 72' fill='none' stroke='${color}' stroke-opacity='${op}' stroke-width='0.9'><path ${petal}/><path ${petal} transform='rotate(90 36 36)'/><path ${petal} transform='rotate(180 36 36)'/><path ${petal} transform='rotate(270 36 36)'/><g fill='${color}' fill-opacity='${op}' stroke='none'><circle cx='36' cy='36' r='2'/><circle cx='0' cy='0' r='1.6'/><circle cx='72' cy='0' r='1.6'/><circle cx='0' cy='72' r='1.6'/><circle cx='72' cy='72' r='1.6'/></g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};

const lightBg: React.CSSProperties = {
  backgroundColor: '#FFF8EE',
  backgroundImage: `
    radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.22) 0%, transparent 65%),
    ${kolamTile('#B8902A', 0.3)},
    linear-gradient(to bottom, #FFFBF5, #FFF2DF)
  `,
  backgroundSize: 'auto, 72px 72px, auto',
};

const darkBg: React.CSSProperties = {
  backgroundColor: '#4A040F',
  backgroundImage: `
    radial-gradient(ellipse at 50% 30%, rgba(212,175,55,0.28) 0%, transparent 70%),
    ${kolamTile('#D4AF37', 0.2)},
    linear-gradient(180deg, #600814 0%, #35020A 100%)
  `,
  backgroundSize: 'auto, 72px 72px, auto',
};

const blessing = {
  invitation: 'திருமண அழைப்பிதழ்',
};

/* =====================================================================
   ORNAMENTS
   ===================================================================== */

const Mandala = ({ className = '' }: { className?: string }) => {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox='0 0 200 200' className={className} fill='none' stroke={`url(#mandalaGold-${id})`} strokeWidth='0.85' aria-hidden='true'>
      <defs>
        <linearGradient id={`mandalaGold-${id}`} x1='0%' y1='0%' x2='100%' y2='100%'>
          <stop offset='0%' stopColor='#8A672F' />
          <stop offset='50%' stopColor='#D4AF37' />
          <stop offset='100%' stopColor='#FFE8A3' />
        </linearGradient>
      </defs>
      {Array.from({ length: 16 }).map((_, i) => (
        <ellipse key={`a${i}`} cx='100' cy='50' rx='9' ry='34' transform={`rotate(${i * 22.5} 100 100)`} />
      ))}
      {Array.from({ length: 12 }).map((_, i) => (
        <ellipse key={`b${i}`} cx='100' cy='68' rx='6' ry='20' transform={`rotate(${i * 30 + 15} 100 100)`} />
      ))}
      <circle cx='100' cy='100' r='96' strokeWidth='1.2' />
      <circle cx='100' cy='100' r='88' strokeDasharray='2 3' />
      <circle cx='100' cy='100' r='30' />
      <circle cx='100' cy='100' r='8' fill='#D4AF37' />
    </svg>
  );
};

const Lotus = ({ className = '', stroke = GOLD }: { className?: string; stroke?: string }) => (
  <svg viewBox='0 0 40 24' className={className} fill='none' stroke={stroke} strokeWidth='1.3' aria-hidden='true'>
    <path d='M20 22 C14 16 14 8 20 2 C26 8 26 16 20 22Z' fill='rgba(212,175,55,0.12)' />
    <path d='M20 22 C10 20 6 12 8 7 C14 9 18 14 20 22Z' />
    <path d='M20 22 C30 20 34 12 32 7 C26 9 22 14 20 22Z' />
  </svg>
);

const Corner = ({ className = '' }: { className?: string }) => (
  <svg viewBox='0 0 60 60' className={className} fill='none' stroke={GOLD} aria-hidden='true'>
    <path d='M2 58 V2 H58' strokeWidth='1.8' />
    <path d='M9 58 V9 H58' strokeWidth='0.8' strokeDasharray='2 2' />
    <circle cx='9' cy='9' r='3.5' fill={GOLD} stroke='none' />
    <path d='M16 16 Q24 16 24 24' strokeWidth='1' />
  </svg>
);

const MangoLeaf = () => (
  <svg viewBox='-10 0 20 36' className='w-3.5 h-7 sm:w-4 sm:h-8 drop-shadow-sm' aria-hidden='true'>
    <path d='M0 0 C9 8 9 24 0 36 C-9 24 -9 8 0 0Z' fill='#2E5227' />
    <path d='M0 4 V32' stroke='#8DB580' strokeWidth='0.9' />
  </svg>
);

const GoldBead = () => (
  <span className='relative block w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-gradient-to-br from-[#FFE8A3] via-[#D4AF37] to-[#8A672F] shadow-sm'>
    <span className='absolute inset-[3px] rounded-full bg-[#FFE8A3]' />
  </span>
);

const Toran = ({ reduce, className = '' }: { reduce: boolean | null; className?: string }) => {
  const strands = Array.from({ length: 11 });
  return (
    <div className={`absolute top-0 inset-x-0 z-20 pointer-events-none ${className}`} aria-hidden='true'>
      <div className='h-[4px] w-full bg-gradient-to-r from-[#8A672F] via-[#FFE8A3] to-[#8A672F] shadow-md' />
      <div className='flex justify-between px-1 sm:px-6'>
        {strands.map((_, i) => {
          const links = 1 + Math.round(Math.abs(Math.sin((i / (strands.length - 1)) * Math.PI)) * 2);
          return (
            <motion.div
              key={i}
              style={{ transformOrigin: 'top center' }}
              animate={reduce ? undefined : { rotate: [-2.5, 2.5, -2.5] }}
              transition={{ duration: 4 + (i % 3) * 0.7, repeat: Infinity, ease: 'easeInOut', delay: i * 0.18 }}
              className={`flex-col items-center ${i % 2 ? 'hidden sm:flex' : 'flex'}`}
            >
              <span className='block w-px h-3.5 bg-gradient-to-b from-[#FFE8A3] to-[#D4AF37]' />
              {Array.from({ length: links }).map((__, k) => (
                <div key={k} className='mb-0.5'>
                  <GoldBead />
                </div>
              ))}
              <MangoLeaf />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const TempleBorder = ({ className = '' }: { className?: string }) => (
  <div
    aria-hidden='true'
    className={`w-full h-[18px] pointer-events-none shadow-sm ${className}`}
    style={{ backgroundImage: TEMPLE_BORDER, backgroundRepeat: 'repeat-x', backgroundSize: '28px 18px' }}
  />
);

/* ---------- Dravidian gopuram line-art, used as the background picture ---------- */

const buildTower = (cx: number, baseY: number, s: number, tiers: number, key: string) => {
  const els: React.ReactNode[] = [];
  const baseW = 170 * s;
  const tierH = 22 * s;
  let y = baseY;

  // gateway block + doorway
  els.push(<rect key={`${key}-g`} x={cx - baseW / 2} y={y - 34 * s} width={baseW} height={34 * s} />);
  els.push(
    <path
      key={`${key}-d`}
      d={`M${cx - 12 * s} ${y} V${y - 18 * s} A${12 * s} ${12 * s} 0 0 1 ${cx + 12 * s} ${y - 18 * s} V${y}`}
    />,
  );
  y -= 34 * s;

  for (let i = 0; i < tiers; i++) {
    const wBot = baseW * (1 - i * 0.1);
    const wTop = wBot - 10 * s;
    els.push(
      <path key={`${key}-t${i}`} d={`M${cx - wBot / 2} ${y} L${cx - wTop / 2} ${y - tierH} H${cx + wTop / 2} L${cx + wBot / 2} ${y}Z`} />,
    );
    els.push(
      <rect key={`${key}-c${i}`} x={cx - wBot / 2 - 3 * s} y={y - 1.5 * s} width={wBot + 6 * s} height={3 * s} fill='currentColor' />,
    );
    const count = Math.max(3, Math.floor(wTop / (16 * s)));
    for (let k = 0; k < count; k++) {
      const x = cx - wTop / 2 + (k + 0.5) * (wTop / count) - 3 * s;
      els.push(<rect key={`${key}-n${i}-${k}`} x={x} y={y - tierH + 6 * s} width={6 * s} height={10 * s} />);
    }
    y -= tierH;
  }

  // barrel-vault roof and kalasams
  const topW = baseW * (1 - tiers * 0.1);
  els.push(<path key={`${key}-r`} d={`M${cx - topW / 2} ${y} Q${cx} ${y - 26 * s} ${cx + topW / 2} ${y}Z`} />);
  y -= 20 * s;
  for (let k = -2; k <= 2; k++) {
    const x = cx + (k * topW) / 5;
    els.push(<line key={`${key}-kl${k}`} x1={x} y1={y + 8 * s} x2={x} y2={y - 4 * s} />);
    els.push(<ellipse key={`${key}-ke${k}`} cx={x} cy={y - 8 * s} rx={3 * s} ry={4.5 * s} fill='currentColor' />);
  }
  return els;
};

const TempleSilhouette = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox='0 0 600 360'
    className={className}
    fill='currentColor'
    fillOpacity='0.1'
    stroke='currentColor'
    strokeWidth='1.4'
    strokeLinejoin='round'
    preserveAspectRatio='xMidYMax meet'
    aria-hidden='true'
  >
    {/* prakaram wall with pillars */}
    <rect x='0' y='318' width='600' height='42' />
    <rect x='0' y='294' width='600' height='5' fill='currentColor' />
    {Array.from({ length: 24 }).map((_, i) => (
      <rect key={i} x={8 + i * 25} y='300' width='9' height='18' />
    ))}
    {buildTower(110, 318, 0.62, 5, 'L')}
    {buildTower(490, 318, 0.62, 5, 'R')}
    {buildTower(300, 318, 1.15, 7, 'M')}
  </svg>
);

/* ---------- bride and groom exchanging garlands under a mandap (original vector art) ---------- */

const MandapCouple = ({ size = 120, className = '' }: { size?: number; className?: string }) => (
  <svg viewBox='0 0 200 200' width={size} height={size} className={className} fill='currentColor' aria-hidden='true'>
    {/* canopy */}
    <rect x='99' y='16' width='2' height='7' />
    <ellipse cx='100' cy='12' rx='3.5' ry='5' />
    <path d='M46 52 C50 34 82 28 100 20 C118 28 150 34 154 52Z' />
    <rect x='44' y='52' width='112' height='6' />
    {Array.from({ length: 9 }).map((_, i) => (
      <path key={i} d={`M${46 + i * 12} 58 a6 6 0 0 0 12 0Z`} />
    ))}
    {/* hanging marigold strings */}
    {[76, 100, 124].map((x) => (
      <g key={x}>
        <rect x={x - 0.5} y='64' width='1' height='20' />
        <circle cx={x} cy='71' r='2.6' fill='#F59E0B' />
        <circle cx={x} cy='79' r='2.6' fill='#F59E0B' />
      </g>
    ))}
    {/* pillars */}
    <rect x='50' y='58' width='8' height='118' />
    <rect x='142' y='58' width='8' height='118' />
    <rect x='48' y='90' width='12' height='3' />
    <rect x='140' y='90' width='12' height='3' />
    <rect x='48' y='125' width='12' height='3' />
    <rect x='140' y='125' width='12' height='3' />
    <rect x='46' y='170' width='16' height='6' />
    <rect x='138' y='170' width='16' height='6' />
    <rect x='38' y='176' width='124' height='5' rx='2' />
    {/* groom */}
    <circle cx='83' cy='98' r='7.5' />
    <rect x='80.5' y='105' width='5' height='4' />
    <path d='M70 112 Q83 107 95 113 L93 146 L72 146Z' />
    <path d='M72 146 L93 146 L96 176 L69 176Z' />
    <path d='M93 117 L102 126' stroke='currentColor' strokeWidth='4.5' strokeLinecap='round' fill='none' />
    {/* bride */}
    <circle cx='117' cy='98' r='7.5' />
    <circle cx='123' cy='92' r='4' />
    <rect x='114.5' y='105' width='5' height='4' />
    <path d='M106 113 Q117 107 130 112 L128 138 L108 138Z' />
    <path d='M108 138 L128 138 L136 176 L102 176Z' />
    <path d='M107 117 L98 126' stroke='currentColor' strokeWidth='4.5' strokeLinecap='round' fill='none' />
    {/* flower garland between them */}
    <circle cx='100' cy='128' r='9' fill='none' stroke='#F59E0B' strokeWidth='4.5' strokeLinecap='round' strokeDasharray='0.1 5.2' />
  </svg>
);

const MayilEmblem = ({ size = 44, className = '' }: { size?: number; className?: string }) => {
  const gid = useId().replace(/:/g, '');
  return (
    <div className={`inline-flex items-center justify-center select-none ${className}`} style={{ width: size, height: size }} aria-hidden='true'>
      <svg viewBox='0 0 100 100' fill='none' className='w-full h-full drop-shadow-md'>
        <defs>
          <linearGradient id={`peacockGrad-${gid}`} x1='0%' y1='0%' x2='100%' y2='100%'>
            <stop offset='0%' stopColor='#8A0E28' />
            <stop offset='50%' stopColor='#D4AF37' />
            <stop offset='100%' stopColor='#6E0B18' />
          </linearGradient>
        </defs>
        {Array.from({ length: 7 }).map((_, i) => (
          <ellipse key={i} cx='50' cy='34' rx='4.5' ry='16' transform={`rotate(${-60 + i * 20} 50 60)`} fill={`url(#peacockGrad-${gid})`} opacity='0.85' />
        ))}
        <path d='M46 54 C42 46 45 36 52 34 C58 32 62 38 58 44 C56 48 54 52 56 64 C56 72 44 76 42 66 C40 60 44 56 46 54 Z' fill={`url(#peacockGrad-${gid})`} />
        <circle cx='54' cy='28' r='1.5' fill='#FFE8A3' />
        <line x1='53' y1='33' x2='54' y2='29' stroke='#D4AF37' strokeWidth='1.2' />
        <ellipse cx='50' cy='74' rx='18' ry='4' fill={`url(#peacockGrad-${gid})`} />
      </svg>
    </div>
  );
};

const Gopuram = ({ size = 56 }: { size?: number }) => (
  <svg viewBox='0 0 100 100' width={size} height={size} fill='none' stroke={GOLD} strokeWidth='1.6' strokeLinejoin='round' aria-hidden='true'>
    <circle cx='50' cy='52' r='40' fill={GOLD} fillOpacity='0.12' stroke='none' />
    <path d='M24 82 L28 64 H72 L76 82Z' />
    <path d='M30 64 L34 48 H66 L70 64Z' />
    <path d='M36 48 L40 34 H60 L64 48Z' />
    <path d='M42 34 L46 22 H54 L58 34Z' />
    <path d='M50 22 V12' />
    <ellipse cx='50' cy='10' rx='3' ry='4.5' fill={GOLD} />
    <path d='M45 82 V74 A5 5 0 0 1 55 74 V82' />
    <path d='M18 82 H82 M14 87 H86' strokeLinecap='round' />
  </svg>
);

const Monogram = ({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) => {
  const gid = useId().replace(/:/g, '');
  const sizeMap = { sm: 'w-16 h-16', md: 'w-24 h-24', lg: 'w-36 h-36' };
  return (
    <div className={`relative inline-flex items-center justify-center select-none ${sizeMap[size]} ${className}`} aria-label='Santhosh and Maha Wedding Monogram'>
      <svg viewBox='0 0 200 200' fill='none' className='w-full h-full drop-shadow-xl'>
        <defs>
          <linearGradient id={`mg-${gid}`} x1='0%' y1='0%' x2='100%' y2='100%'>
            <stop offset='0%' stopColor='#8A672F' />
            <stop offset='25%' stopColor='#D4AF37' />
            <stop offset='50%' stopColor='#FFE8A3' />
            <stop offset='75%' stopColor='#D4AF37' />
            <stop offset='100%' stopColor='#8A672F' />
          </linearGradient>
        </defs>
        <circle cx='100' cy='100' r='92' fill='#FFF8EE' fillOpacity='0.98' />
        <circle cx='100' cy='100' r='89' stroke={`url(#mg-${gid})`} strokeWidth='1.3' strokeDasharray='2 3' />
        <circle cx='100' cy='100' r='82' stroke={`url(#mg-${gid})`} strokeWidth='2' />
        <circle cx='100' cy='100' r='74' stroke={`url(#mg-${gid})`} strokeWidth='0.8' opacity='0.75' />
        <path d='M 72 58 Q 100 46 128 58' stroke={`url(#mg-${gid})`} strokeWidth='1.6' strokeLinecap='round' />
        <text x='72' y='118' textAnchor='middle' fontFamily='Cinzel, serif' fontSize='56' fontWeight='700' fill='#7A0A1A'>S</text>
        <text x='100' y='112' textAnchor='middle' fontFamily='Cormorant Garamond, serif' fontSize='28' fontStyle='italic' fill={`url(#mg-${gid})`}>&amp;</text>
        <text x='128' y='118' textAnchor='middle' fontFamily='Cinzel, serif' fontSize='56' fontWeight='700' fill='#7A0A1A'>M</text>
        <path d='M 72 144 Q 100 156 128 144' stroke={`url(#mg-${gid})`} strokeWidth='1.6' strokeLinecap='round' />
      </svg>
    </div>
  );
};

const Divider = ({ className = '', dark = false }: { className?: string; dark?: boolean }) => (
  <div className={`flex items-center justify-center gap-2.5 my-4 select-none ${className}`} aria-hidden='true'>
    <span className='w-12 sm:w-24 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-[#D4AF37]' />
    <span className='w-1.5 h-1.5 rotate-45 bg-[#D4AF37]' />
    <Lotus className='w-8 sm:w-10' stroke={dark ? '#FFE8A3' : GOLD} />
    <span className='w-1.5 h-1.5 rotate-45 bg-[#D4AF37]' />
    <span className='w-12 sm:w-24 h-px bg-gradient-to-l from-transparent via-[#D4AF37] to-[#D4AF37]' />
  </div>
);

/* =====================================================================
   DATA
   ===================================================================== */

let p = {
  couple: {
    groom: 'Santhosh Akash',
    bride: 'Maha Lakshmi',
    brideFull: 'Essaki Ammal & Maha Lakshmi',
    groomFirst: 'Santhosh',
    brideFirst: 'Maha',
    brideShort: 'Maha',
    groomShort: 'Santhosh',
    monogramInitials: 'SM',
    displayNames: 'Santhosh & Maha Lakshmi',
    groomRoleTitle: 'The Groom',
    brideRoleTitle: 'The Bride',
    storyHeadline: 'Two Journeys, One Auspicious Union',
    storyBride:
      'Santhosh brings steadiness, warmth, and a quiet strength to the life they are beginning together.',
    storyGroom:
      'Maha brings grace, kindness, and joy. Essaki Ammal & Maha Lakshmi steps into this marriage with a full and generous heart.',
    storyFuture:
      'With the blessings of their families, Santhosh and Maha step into a shared future filled with warmth, hospitality, and care for one another.',
  },
  eventDate: {
    dayOfWeek: 'Sunday',
    dayNumber: 29,
    month: 'November',
    year: 2026,
    formattedDate: 'Sunday, 29 November 2026',
    fullDateIso: '2026-11-29',
    ceremonyTimeIso: '2026-11-29T09:00:00+05:30',
  },
  ceremony: {
    title: 'THE WEDDING CEREMONY',
    date: '2026-11-29',
    displayDate: 'Sunday, November 29, 2026',
    shortDate: 'Sunday, Nov 29',
    dayOfWeek: 'Sunday',
    time: '9:00 AM',
    venue: 'Vasantham Mahal Kalyana Mandapam',
    street: 'Opp. Municipal Bus Stop, Pudhu',
    city: 'Tirunelveli',
    state: 'Tamil Nadu',
    landmark: 'Near Municipal Bus Stand, Pettai',
    fullAddress:
      'Opp. Municipal Bus Stop, Pudhu, Pettai, Tirunelveli, Tamil Nadu 627004',
    mapQuery:
      'Vasantham Mahal Kalyana Mandapam, Opp. Municipal Bus Stop, Pudhu, Tirunelveli, Tamil Nadu 627004',
    googleMapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Vasantham+Mahal+Kalyana+Mandapam+Opp+Municipal+Bus+Stop+Tirunelveli+Tamil+Nadu+627004',
    embedMapUrl:
      'https://maps.google.com/maps?q=Vasantham+Mahal+Kalyana+Mandapam,+Opp.+Municipal+Bus+Stop,+Pudhu,+Tirunelveli,+Tamil+Nadu+627004&t=&z=17&ie=UTF8&iwloc=&output=embed',
    timeZone: 'Asia/Kolkata',
    ceremonyTimeIso: '2026-11-29T09:00:00+05:30',
  },
  scriptures: {
    heroVerse:
      'Wishing a joyful thirumanam, an auspicious subha muhurtham, and a home blessed with mangalyam.',
    heroRef: '',
    covenantVerse:
      'I take your hand in mine for happiness, that we may grow old together, loving and beloved.',
    covenantRef: 'Atharva Veda',
    loveVerse:
      'May your home be bright with laughter, and your bond as enduring as the sacred fire.',
    loveRef: 'Vivah Blessing',
    blessingVerse:
      'May every obstacle fall away, and may love and prosperity dwell in your home.',
    blessingRef: 'Mangal Ashirvad',
  },
  invitationMessage: {
    tagline: 'CELEBRATING LOVE & VIVAHA',
    familyLine: 'Together with their families,',
    body: 'With grateful hearts and the blessings of our families, we joyfully invite you to celebrate the beginning of our new journey together. Your presence and good wishes will make our special day even more meaningful.',
    closingTitle: 'TWO HEARTS. ONE BLESSED PATH.',
    closingBody:
      'We look forward to celebrating this beautiful beginning with you.',
    guestWelcomeHeading: 'We Are Waiting to Welcome You',
    guestWelcomeText:
      'Come, as we are eagerly waiting and hoping to welcome you on our most beautiful occasion. Your presence, blessings, and good wishes will illuminate this unforgettable milestone in our lives.',
  },
  photoWall: {
    title: 'Memories & Moments',
    subtitle:
      'A gallery of love, laughter, and cherished pre-wedding portraits.',
    slots: ['/gallery/photo-1.jpeg', '/gallery/photo-2.jpeg'].map((src, i) => ({
      id: i + 1,
      title: `Moment ${i + 1}`,
      caption: 'Pre-wedding memories and celebration',
      aspect: 'aspect-[4/5]',
      src,
    })),
  },
};

/* =====================================================================
   AUDIO CONTROLLER
   ===================================================================== */

class AudioPlayerController {
  audio: HTMLAudioElement | null = null;
  isPlaying = false;
  currentVolume = 0.65;
  subscribers = new Set<(playing: boolean) => void>();
  audioSrc = '/audio/Marriage_song.mp3';
  fallbackSrc = '/Marriage_song.mp3';
  initialized = false;

  init(e?: string) {
    if (typeof window === 'undefined') return;
    if (e) this.audioSrc = e;
    if (!this.initialized || !this.audio) {
      try {
        this.audio = new Audio();
        this.audio.src = this.audioSrc;
        this.audio.loop = true;
        this.audio.volume = this.currentVolume;
        this.audio.preload = 'auto';
        this.audio.addEventListener('play', () => this.notify(true));
        this.audio.addEventListener('pause', () => this.notify(false));
        this.audio.addEventListener('ended', () => this.notify(false));
        this.audio.addEventListener('error', () => {
          if (this.audio && this.audio.src.includes('/audio/Marriage_song.mp3')) {
            this.audio.src = this.fallbackSrc;
            this.audio.play().catch(() => { });
          }
        });
        this.initialized = true;
      } catch (err) {
        console.warn('Audio could not be initialized:', err);
      }
    }
  }
  subscribe(e: (playing: boolean) => void) {
    this.subscribers.add(e);
    e(this.isPlaying);
    return () => {
      this.subscribers.delete(e);
    };
  }
  notify(e: boolean) {
    this.isPlaying = e;
    this.subscribers.forEach((t) => t(e));
  }
  async play() {
    this.init();
    if (this.audio) {
      try {
        await this.audio.play();
        this.notify(true);
        return true;
      } catch (err) {
        console.warn('Audio play blocked:', err);
      }
    }
    this.notify(false);
    return false;
  }
  pause() {
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
    }
    this.notify(false);
  }
  toggle() {
    return this.isPlaying ? (this.pause(), false) : (this.play(), true);
  }
  getIsPlaying() {
    return this.isPlaying;
  }
}
const audio = new AudioPlayerController();

/* =====================================================================
   SHARED LAYOUT PIECES
   ===================================================================== */

type Art = 'temple' | 'mandala' | 'none';

const Section = ({
  id,
  tone = 'light',
  art = 'temple',
  border = true,
  children,
  className = '',
}: {
  id: string;
  tone?: 'light' | 'dark';
  art?: Art;
  border?: boolean;
  children: React.ReactNode;
  className?: string;
}) => {
  const dark = tone === 'dark';
  const photo = TEMPLE_PHOTOS[id];
  return (
    <section
      id={id}
      className={`relative select-none overflow-hidden px-4 pt-20 pb-14 sm:pt-28 sm:pb-24 text-center ${dark ? 'text-[#FFE8A3]' : 'text-[#3E2214]'} ${className}`}
      style={dark ? darkBg : lightBg}
    >
      {/* real photo, toned to the palette and faded at top and bottom */}
      {photo && (
        <div
          aria-hidden='true'
          className='absolute inset-0 pointer-events-none'
          style={{
            backgroundImage: `url(${photo})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: dark ? 0.24 : 0.16,
            filter: 'sepia(0.85) saturate(0.8) contrast(1.05)',
            mixBlendMode: dark ? 'screen' : 'multiply',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, #000 22%, #000 78%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, #000 22%, #000 78%, transparent 100%)',
          }}
        />
      )}

      {art === 'temple' && !photo && (
        <TempleSilhouette
          className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-[860px] sm:w-[1100px] max-w-none pointer-events-none ${dark ? 'text-[#D4AF37] opacity-[0.16]' : 'text-[#6E0B18] opacity-[0.09]'}`}
        />
      )}
      {art === 'mandala' && (
        <>
          <Mandala className={`absolute -top-28 -left-28 w-[380px] sm:w-[520px] pointer-events-none ${dark ? 'opacity-[0.16]' : 'opacity-[0.22]'}`} />
          <Mandala className={`absolute -bottom-28 -right-28 w-[380px] sm:w-[520px] pointer-events-none ${dark ? 'opacity-[0.16]' : 'opacity-[0.22]'}`} />
        </>
      )}

      {border && <TempleBorder className='absolute top-0 inset-x-0' />}
      {children}
    </section>
  );
};

const Reveal = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 22 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    className={`relative z-10 ${className}`}
  >
    {children}
  </motion.div>
);

const Heading = ({ en, ta, dark = false }: { en: string; ta?: string; dark?: boolean }) => (
  <div className='flex flex-col items-center'>
    <h2 className={`text-2xl sm:text-4xl font-semibold tracking-wider leading-tight ${HEAD} ${dark ? 'text-[#FFE8A3]' : 'text-[#6E0B18]'}`}>
      {en}
    </h2>
    {ta && (
      <p className={`mt-1 text-sm sm:text-base font-semibold ${T} ${dark ? 'text-[#D4AF37]' : 'text-[#8A672F]'}`}>{ta}</p>
    )}
    <Divider dark={dark} />
  </div>
);

/* =====================================================================
   ENTRANCE: royal doors open to a glowing temple
   ===================================================================== */

const Entrance = ({ onEnter }: { onEnter: () => void }) => {
  const [opening, setOpening] = useState(false);
  const reduce = useReducedMotion();

  const handleOpenDoors = () => {
    if (opening) return;
    audio.play().catch(() => { });
    setOpening(true);
    try {
      confetti({
        particleCount: 85,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#D4AF37', '#FFE8A3', '#8A672F', '#9B111E', '#FFF8EE'],
        disableForReducedMotion: true,
      });
    } catch { }
    setTimeout(onEnter, 1500);
  };

  return (
    <motion.div
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9, ease: 'easeInOut' }}
      className='fixed inset-0 z-50 flex items-center justify-center overflow-hidden w-full h-[100dvh] max-h-screen select-none touch-none overscroll-none'
      style={{ ...darkBg, perspective: 1800 }}
    >
      {/* the temple waiting behind the doors */}
      {TEMPLE_PHOTOS.entrance ? (
        <div
          aria-hidden='true'
          className='absolute inset-0 pointer-events-none'
          style={{
            backgroundImage: `url(${TEMPLE_PHOTOS.entrance})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center bottom',
            opacity: 0.55,
            filter: 'sepia(0.8) saturate(0.9) contrast(1.05)',
            mixBlendMode: 'screen',
          }}
        />
      ) : (
        <TempleSilhouette className='absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] sm:w-[1250px] max-w-none text-[#FFE8A3] opacity-45 pointer-events-none' />
      )}

      {/* golden light burst */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={opening ? { opacity: [0, 1, 1], scale: [0.6, 1.45, 1.6] } : { opacity: 0 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        className='absolute inset-0 z-30 pointer-events-none flex items-center justify-center'
      >
        <div
          className='w-[600px] sm:w-[950px] h-[600px] sm:h-[950px] rounded-full blur-2xl'
          style={{
            background:
              'radial-gradient(circle, rgba(255,232,163,0.95) 0%, rgba(212,175,55,0.75) 30%, rgba(122,10,26,0.35) 60%, transparent 75%)',
          }}
        />
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={`ray-${i}`}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={opening ? { opacity: [0, 0.85, 0.3], scaleX: [0, 1.5, 2] } : {}}
            transition={{ duration: 1.3, delay: 0.1 + i * 0.04 }}
            className='absolute w-[900px] h-[2px] pointer-events-none'
            style={{
              transform: `rotate(${i * 22.5}deg)`,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,232,163,0.85) 50%, transparent 100%)',
            }}
          />
        ))}
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i / 16) * Math.PI * 2;
          const dist = 180 + (i % 4) * 80;
          return (
            <motion.div
              key={`spark-${i}`}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
              animate={opening ? { x: [0, Math.cos(angle) * dist], y: [0, Math.sin(angle) * dist], opacity: [0, 1, 0], scale: [0, 1.8, 0] } : {}}
              transition={{ duration: 1.25, delay: 0.12 + (i % 5) * 0.05, ease: 'easeOut' }}
              className='absolute w-3 h-3 pointer-events-none'
            >
              <svg viewBox='0 0 24 24' fill='none' className='w-full h-full drop-shadow-[0_0_8px_rgba(255,232,163,0.9)]'>
                <path d='M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z' fill='#FFE8A3' />
              </svg>
            </motion.div>
          );
        })}
      </motion.div>

      {/* left door */}
      <motion.div
        initial={{ rotateY: 0 }}
        animate={{ rotateY: opening ? -105 : 0 }}
        transition={{ duration: 1.4, ease: [0.65, 0, 0.35, 1] }}
        style={{ transformOrigin: 'left center' }}
        className='absolute inset-y-0 left-0 w-1/2 bg-[#5A0813] border-r-2 border-[#D4AF37] shadow-[25px_0_50px_rgba(0,0,0,0.8)] z-40 overflow-hidden flex items-center justify-end'
      >
        <div className='absolute inset-0 opacity-30' style={darkBg} />
        <TempleBorder className='absolute top-0 inset-x-0' />
        <TempleBorder className='absolute bottom-0 inset-x-0' />
        <div className='absolute inset-4 sm:inset-8 border border-[#D4AF37]/50 rounded-l-2xl pointer-events-none' />
        <Corner className='absolute top-4 left-4 sm:top-8 sm:left-8 w-12 sm:w-16 pointer-events-none' />
        <Corner className='absolute bottom-4 left-4 sm:bottom-8 sm:left-8 w-12 sm:w-16 pointer-events-none -rotate-90' />
        <div className='relative pr-3 sm:pr-8 opacity-40 pointer-events-none'>
          <Mandala className='w-48 sm:w-72' />
        </div>
      </motion.div>

      {/* right door */}
      <motion.div
        initial={{ rotateY: 0 }}
        animate={{ rotateY: opening ? 105 : 0 }}
        transition={{ duration: 1.4, ease: [0.65, 0, 0.35, 1] }}
        style={{ transformOrigin: 'right center' }}
        className='absolute inset-y-0 right-0 w-1/2 bg-[#5A0813] border-l-2 border-[#D4AF37] shadow-[-25px_0_50px_rgba(0,0,0,0.8)] z-40 overflow-hidden flex items-center justify-start'
      >
        <div className='absolute inset-0 opacity-30' style={darkBg} />
        <TempleBorder className='absolute top-0 inset-x-0' />
        <TempleBorder className='absolute bottom-0 inset-x-0' />
        <div className='absolute inset-4 sm:inset-8 border border-[#D4AF37]/50 rounded-r-2xl pointer-events-none' />
        <Corner className='absolute top-4 right-4 sm:top-8 sm:right-8 w-12 sm:w-16 pointer-events-none rotate-90' />
        <Corner className='absolute bottom-4 right-4 sm:bottom-8 sm:right-8 w-12 sm:w-16 pointer-events-none rotate-180' />
        <div className='relative pl-3 sm:pl-8 opacity-40 pointer-events-none'>
          <Mandala className='w-48 sm:w-72' />
        </div>
      </motion.div>

      {/* toran across the full width, above the doors */}
      <motion.div
        animate={{ opacity: opening ? 0 : 1 }}
        transition={{ duration: 0.6, delay: opening ? 0.4 : 0 }}
        className='absolute inset-x-0 top-0 z-[60] pointer-events-none'
      >
        <Toran reduce={reduce} />
      </motion.div>

      {/* bride and groom under the mandap (hidden on short screens so it never overlaps the card) */}
      <motion.div
        animate={{ opacity: opening ? 0 : 1 }}
        transition={{ duration: 0.5 }}
        className='absolute inset-x-0 bottom-2 sm:bottom-6 z-[55] flex justify-center pointer-events-none [@media(max-height:740px)]:hidden'
      >
        <MandapCouple size={84} className='text-[#FFE8A3] drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]' />
      </motion.div>

      {/* invitation plaque */}
      <motion.div
        animate={opening ? { opacity: 0, scale: 0.85, y: -20 } : { opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className='relative z-50 mt-10 flex flex-col items-center text-center w-[90%] max-w-[370px] pointer-events-auto'
      >
        <div className='w-full rounded-t-[190px] rounded-b-3xl bg-gradient-to-b from-[#FFFDF9] via-[#FFF8EE] to-[#F7E7CD] p-1.5 ring-4 ring-[#D4AF37]/90 shadow-[0_28px_80px_rgba(0,0,0,0.7)] border-2 border-[#8A672F]'>
          <div className='relative overflow-hidden flex flex-col items-center text-center px-5 sm:px-7 pt-9 sm:pt-11 pb-7 sm:pb-9 rounded-t-[182px] rounded-b-[20px] border border-[#D4AF37]'>
            <Mandala className='absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 w-[130%] opacity-[0.14] pointer-events-none' />

            <div className='relative inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#5A0813] border-2 border-[#D4AF37] shadow-md'>
              <Lotus className='w-6 h-6' stroke='#FFE8A3' />
            </div>

            <div className='relative mt-3 sm:mt-4 p-1 rounded-full border-2 border-[#D4AF37] bg-[#FFF8EE] shadow-inner'>
              <Monogram size='sm' className='w-14 h-14 sm:w-16 sm:h-16' />
            </div>

            <div className='relative my-2 flex flex-col items-center justify-center'>
              <h1 className={`text-3xl sm:text-4xl font-semibold leading-tight text-[#6E0B18] ${SCRIPT}`}>{p.couple.groomFirst}</h1>
              <div className='flex items-center justify-center gap-2 my-0.5'>
                <span className='w-6 sm:w-10 h-px bg-gradient-to-r from-transparent to-[#D4AF37]' />
                <span className={`text-xs italic text-[#8A672F] ${D}`}>weds</span>
                <span className='w-6 sm:w-10 h-px bg-gradient-to-l from-transparent to-[#D4AF37]' />
              </div>
              <h1 className={`text-3xl sm:text-4xl font-semibold leading-tight text-[#6E0B18] ${SCRIPT}`}>{p.couple.brideFirst}</h1>
            </div>

            <p className={`relative mt-2 max-w-[17rem] text-xs sm:text-sm italic leading-snug text-[#4A2A1A] font-medium ${D}`}>
              {p.scriptures.heroVerse}
            </p>

            <button
              onClick={handleOpenDoors}
              disabled={opening}
              aria-label='Enter Wedding Invitation'
              className={`group relative mt-5 px-10 py-3 rounded-full border-2 border-[#FFE8A3] bg-gradient-to-b from-[#8A1426] via-[#6E0B18] to-[#42050E] text-[#FFE8A3] text-sm sm:text-base font-bold tracking-[0.25em] shadow-[0_8px_24px_rgba(110,11,24,0.5)] hover:scale-105 active:scale-95 transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37] ${C}`}
            >
              <span className='relative z-10 drop-shadow-sm'>OPEN INVITATION</span>
              <div className='absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-[#FFE8A3]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity' />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* =====================================================================
   HERO: scratch to reveal + countdown
   ===================================================================== */

const calendarUrl = () => {
  const title = encodeURIComponent(`Wedding of ${p.couple.bride} & ${p.couple.groom}`);
  const details = encodeURIComponent(`Celebrating the wedding of ${p.couple.bride} and ${p.couple.groom}.

Ceremony: ${p.ceremony.displayDate} at ${p.ceremony.time}
Venue: ${p.ceremony.venue}
Address: ${p.ceremony.fullAddress}
Time Zone: ${p.ceremony.timeZone}`);
  const loc = encodeURIComponent(`${p.ceremony.venue}, ${p.ceremony.fullAddress}`);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${loc}&dates=20261129T033000Z/20261129T073000Z&ctz=Asia/Kolkata`;
};

const ScratchReveal = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [down, setDown] = useState(false);
  const [left, setLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date(p.eventDate.ceremonyTimeIso).getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas || !box) return;
    const r = box.getBoundingClientRect();
    const w = Math.floor(r.width);
    const h = Math.floor(r.height);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#8A672F');
    grad.addColorStop(0.25, '#D4AF37');
    grad.addColorStop(0.5, '#FFE8A3');
    grad.addColorStop(0.75, '#D4AF37');
    grad.addColorStop(1, '#8A672F');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(110, 11, 24, 0.6)';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = '#42050E';
    ctx.font = '700 15px "Tenor Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SCRATCH TO REVEAL DATE', w / 2, h / 2 - 8);
    ctx.fillStyle = '#6E0B18';
    ctx.font = 'italic 12px "Cormorant Garamond", serif';
    ctx.fillText('Swipe or drag your finger here', w / 2, h / 2 + 14);
  }, []);

  useEffect(() => {
    paint();
    const onResize = () => {
      if (!revealed) paint();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [paint, revealed]);

  const triggerReveal = () => {
    if (!revealed) {
      setRevealed(true);
      try {
        confetti({
          particleCount: 55,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#D4AF37', '#FFE8A3', '#8A672F', '#A3162B', '#FFFDF9'],
          disableForReducedMotion: true,
        });
      } catch { }
    }
  };

  const scratch = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(clientX - rect.left, clientY - rect.top, 28, 0, Math.PI * 2);
    ctx.fill();
    try {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let cleared = 0;
      const total = data.length / 4;
      for (let k = 3; k < data.length; k += 64) {
        if (data[k] === 0) cleared += 16;
      }
      if ((cleared / total) * 100 > 35) triggerReveal();
    } catch { }
  };

  return (
    <div className='relative w-full max-w-lg mx-auto select-none my-6'>
      <div
        ref={boxRef}
        className='relative min-h-[220px] sm:min-h-[260px] rounded-2xl bg-gradient-to-b from-[#FFFDF9] via-[#FFF8EE] to-[#F7ECD8] border-2 border-[#D4AF37] shadow-[0_16px_40px_rgba(110,11,24,0.18)] overflow-hidden flex flex-col items-center justify-center p-4 sm:p-6 text-center'
      >
        <div className='absolute inset-2 border border-[#D4AF37]/50 rounded-xl pointer-events-none' />
        <div className='relative z-10 w-full flex flex-col items-center py-2'>
          <p className={`text-base sm:text-lg text-[#8A672F] font-bold ${T}`}>முகூர்த்த நேரம்</p>
          <p className={`text-sm sm:text-base text-[#8A672F] font-semibold mt-1 tracking-wider ${C}`}>{p.eventDate.dayOfWeek}</p>
          <h3 className={`text-3xl sm:text-5xl text-[#6E0B18] font-bold my-1 tracking-wide ${C}`}>
            {p.eventDate.dayNumber} {p.eventDate.month} {p.eventDate.year}
          </h3>
          <p className={`text-base sm:text-lg text-[#3E2214] font-semibold ${D}`}>Ceremony at {p.ceremony.time} IST</p>
          <Divider className='my-2' />
          <p className={`text-sm sm:text-base italic text-[#5B3A2A] ${D}`}>Pettai, Tirunelveli</p>
        </div>
        <AnimatePresence>
          {!revealed && (
            <motion.canvas
              ref={canvasRef}
              exit={{ opacity: 0, scale: 1.02, transition: { duration: 0.6 } }}
              onMouseDown={(ev) => {
                setDown(true);
                scratch(ev.clientX, ev.clientY);
              }}
              onMouseMove={(ev) => {
                if (down) scratch(ev.clientX, ev.clientY);
              }}
              onMouseUp={() => setDown(false)}
              onMouseLeave={() => setDown(false)}
              onTouchStart={(ev) => {
                setDown(true);
                if (ev.touches[0]) scratch(ev.touches[0].clientX, ev.touches[0].clientY);
              }}
              onTouchMove={(ev) => {
                if (down && ev.touches[0]) scratch(ev.touches[0].clientX, ev.touches[0].clientY);
              }}
              onTouchEnd={() => setDown(false)}
              className='absolute inset-0 w-full h-full cursor-pointer z-20 touch-none'
            />
          )}
        </AnimatePresence>
      </div>

      {!revealed && (
        <div className='text-center mt-3'>
          <button
            onClick={triggerReveal}
            className={`inline-flex items-center gap-1.5 text-sm text-[#6E0B18]/80 hover:text-[#6E0B18] underline underline-offset-4 transition-colors font-medium ${D}`}
          >
            <Sparkles className='w-3.5 h-3.5 text-[#8A672F]' />
            <span>Tap to reveal automatically</span>
          </button>
        </div>
      )}

      <div className='mt-6 grid grid-cols-4 gap-2 sm:gap-3 max-w-sm mx-auto px-1'>
        {[
          { label: 'Days', val: left.days },
          { label: 'Hours', val: left.hours },
          { label: 'Mins', val: left.minutes },
          { label: 'Secs', val: left.seconds },
        ].map((item) => (
          <div
            key={item.label}
            className='flex flex-col items-center justify-center py-2 sm:py-3 rounded-xl bg-gradient-to-b from-[#8A1426] to-[#42050E] border-2 border-[#D4AF37]/80 shadow-lg'
          >
            <span className={`text-xl sm:text-3xl font-bold text-[#FFE8A3] ${C}`}>{String(item.val).padStart(2, '0')}</span>
            <span className={`text-xs sm:text-sm text-[#D4AF37] font-semibold ${C}`}>{item.label}</span>
          </div>
        ))}
      </div>

      <div className='mt-6 flex justify-center px-2'>
        <button
          onClick={() => window.open(calendarUrl(), '_blank', 'noopener,noreferrer')}
          className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full border-2 border-[#FFE8A3] bg-gradient-to-b from-[#8A1426] to-[#5A0813] text-[#FFE8A3] text-sm sm:text-base font-semibold tracking-wider shadow-lg hover:from-[#A3162B] transition-transform active:scale-95 ${C}`}
        >
          <Calendar className='w-4 h-4' />
          <span>Save the date, 29 Nov</span>
        </button>
      </div>
    </div>
  );
};

const Hero = () => {
  const reduce = useReducedMotion();
  return (
    <Section id='hero' border={false} className='!pt-28 sm:!pt-36'>
      <Toran reduce={reduce} />

      {/* soft centre glow */}
      <div
        className='absolute inset-0 pointer-events-none'
        style={{ backgroundImage: 'radial-gradient(circle at 50% 28%, rgba(212,175,55,0.22) 0%, rgba(122,10,26,0.06) 50%, transparent 75%)' }}
      />

      <Reveal className='max-w-2xl mx-auto flex flex-col items-center'>
        <MayilEmblem size={48} className='mb-2' />
        <h2 className={`mt-1 text-xl sm:text-2xl text-[#6E0B18] font-bold ${T}`}>{blessing.invitation}</h2>
        <p className={`mt-1 text-xs sm:text-sm text-[#8A672F] tracking-widest uppercase ${C}`}>{p.invitationMessage.tagline}</p>
        <p className={`mt-3 text-base sm:text-lg italic text-[#4A2A1A] font-medium ${D}`}>{p.invitationMessage.familyLine}</p>

        <div className='my-5 sm:my-7 w-full max-w-xl px-4 py-6 sm:py-8 rounded-3xl bg-[#FFFDF9]/95 border border-[#D4AF37]/60 shadow-[0_18px_44px_rgba(110,11,24,0.12)] relative overflow-hidden'>
          <Mandala className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] opacity-[0.09] pointer-events-none' />
          <div className='absolute inset-1.5 border border-dashed border-[#D4AF37]/40 rounded-[20px] pointer-events-none' />
          <Corner className='absolute top-2 left-2 w-7 sm:w-9 pointer-events-none' />
          <Corner className='absolute top-2 right-2 w-7 sm:w-9 pointer-events-none rotate-90' />
          <Corner className='absolute bottom-2 left-2 w-7 sm:w-9 pointer-events-none -rotate-90' />
          <Corner className='absolute bottom-2 right-2 w-7 sm:w-9 pointer-events-none rotate-180' />

          <h1 className={`relative text-4xl sm:text-6xl font-semibold leading-tight text-[#6E0B18] ${SCRIPT}`}>{p.couple.groom}</h1>
          <div className='relative flex items-center justify-center gap-3 my-1.5'>
            <span className='w-8 sm:w-16 h-px bg-gradient-to-r from-transparent to-[#D4AF37]' />
            <Lotus className='w-6 sm:w-8' stroke={GOLD} />
            <span className={`text-3xl sm:text-4xl font-semibold leading-none text-[#6E0B18] ${C}`}>&</span>
            <Lotus className='w-6 sm:w-8 rotate-180' stroke={GOLD} />
            <span className='w-8 sm:w-16 h-px bg-gradient-to-l from-transparent to-[#D4AF37]' />
          </div>
          <h1 className={`relative text-4xl sm:text-6xl font-semibold leading-tight text-[#6E0B18] ${SCRIPT}`}>{p.couple.bride}</h1>
        </div>

        <Divider />
        <div className='max-w-md mx-auto px-4'>
          <p className={`text-base sm:text-lg italic text-[#3E2214] leading-relaxed ${D}`}>“{p.scriptures.covenantVerse}”</p>
          <p className={`text-xs sm:text-sm text-[#8A672F] font-bold mt-1 tracking-wider uppercase ${C}`}>{p.scriptures.covenantRef}</p>
        </div>
        <div className='w-full mt-6'>
          <ScratchReveal />
        </div>
      </Reveal>
    </Section>
  );
};

/* =====================================================================
   ENVELOPE
   ===================================================================== */

const Envelope = () => {
  const [open, setOpen] = useState(false);
  return (
    <Section id='envelope-invitation' tone='dark' art='mandala'>
      <Reveal className='max-w-xl mx-auto flex flex-col items-center'>
        <Heading en='The Formal Invitation' dark />
        <p className={`-mt-2 mb-4 text-base sm:text-lg italic text-[#FFE8A3] ${D}`}>
          {open ? 'Your wedding card is open below' : 'Touch the envelope to open the card'}
        </p>

        <div className='w-full flex flex-col items-center'>
          {!open && (
            <motion.button
              type='button'
              aria-label='Open the invitation card'
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              onClick={() => {
                setOpen(true);
                try {
                  confetti({
                    particleCount: 55,
                    spread: 75,
                    origin: { y: 0.5 },
                    colors: ['#D4AF37', '#FFE8A3', '#8A672F', '#A3162B', '#FFFDF9'],
                    disableForReducedMotion: true,
                  });
                } catch { }
              }}
              className='group relative w-full aspect-[1.42/1] max-w-[360px] sm:max-w-[420px] cursor-pointer rounded-2xl bg-[#5A0813] border-2 border-[#D4AF37] shadow-[0_24px_60px_rgba(0,0,0,0.6)] transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98] overflow-hidden'
            >
              <div className='absolute inset-0 pointer-events-none z-10'>
                <div className='absolute inset-0 bg-[#4A0812]' style={{ clipPath: 'polygon(0% 0%, 50% 50%, 0% 100%)' }} />
                <div className='absolute inset-0 bg-[#38040C]' style={{ clipPath: 'polygon(100% 0%, 50% 50%, 100% 100%)' }} />
                <div className='absolute inset-0 bg-[#6E0B18]' style={{ clipPath: 'polygon(0% 100%, 50% 48%, 100% 100%)' }} />
              </div>
              <div
                className='absolute top-0 inset-x-0 w-full h-[58%] pointer-events-none z-20'
                style={{
                  clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                  background: 'linear-gradient(180deg, #8A1426 0%, #6E0B18 70%, #4A0812 100%)',
                  boxShadow: '0 8px 18px rgba(0,0,0,0.4)',
                }}
              />
              <div className='absolute top-[52%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none'>
                <div className='relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#FFFDF9] p-1 border-2 border-[#D4AF37] shadow-[0_8px_24px_rgba(0,0,0,0.6)]'>
                  <Monogram size='md' className='w-full h-full' />
                </div>
              </div>
            </motion.button>
          )}

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className='relative w-full max-w-[480px] rounded-2xl bg-gradient-to-b from-[#FFFDF9] to-[#F7ECD8] p-1.5 ring-2 ring-[#D4AF37] shadow-[0_28px_70px_rgba(0,0,0,0.6)] text-[#3E2214]'
              >
                <div className='relative overflow-hidden rounded-xl border border-[#D4AF37] px-4 py-7 sm:px-8 sm:py-10 flex flex-col items-center'>
                  <Mandala className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] opacity-[0.12] pointer-events-none' />
                  <MayilEmblem size={36} className='relative mb-1' />
                  <p className={`relative text-lg sm:text-xl text-[#8A672F] font-bold ${T}`}>சுப திருமணம்</p>
                  <p className={`relative text-base italic text-[#5B3A2A] mt-0.5 ${D}`}>Together with their families,</p>
                  <div className='relative my-2 space-y-0.5'>
                    <h3 className={`text-3xl sm:text-4xl font-bold leading-tight text-[#6E0B18] ${SCRIPT}`}>{p.couple.groom}</h3>
                    <p className={`text-3xl sm:text-4xl font-semibold leading-none text-[#6E0B18] ${C}`}>&</p>
                    <h3 className={`text-3xl sm:text-4xl font-bold leading-tight text-[#6E0B18] ${SCRIPT}`}>{p.couple.bride}</h3>
                  </div>
                  <Divider className='relative my-2' />
                  <p className={`relative text-base sm:text-lg text-[#3E2214] max-w-sm leading-relaxed ${D}`}>
                    “With grateful hearts and the blessings of our families, we joyfully invite you to celebrate the beginning of our new journey together.”
                  </p>
                  <div className='relative mt-3 px-5 py-2 rounded-full bg-[#5A0813] border border-[#D4AF37]'>
                    <p className={`text-sm sm:text-base font-semibold text-[#FFE8A3] ${C}`}>Sunday, 29 November 2026 · 9:00 AM</p>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className={`relative mt-4 text-sm text-[#6E0B18]/80 hover:text-[#6E0B18] underline underline-offset-4 transition-colors font-semibold ${D}`}
                  >
                    Close card
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Reveal>
    </Section>
  );
};

/* =====================================================================
   VENUE
   ===================================================================== */

const Venue = () => {
  const [copied, setCopied] = useState(false);
  return (
    <Section id='location' art='temple'>
      <Reveal className='max-w-4xl mx-auto'>
        <Heading en='Venue & Directions' />
        <div className='mt-4 rounded-2xl bg-gradient-to-b from-[#FFFDF9] to-[#F7ECD8] p-1.5 ring-2 ring-[#D4AF37] shadow-[0_16px_45px_rgba(110,11,24,0.16)] text-left'>
          <div className='rounded-xl border border-[#D4AF37]/80 p-4 sm:p-8'>
            <div className='grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-center'>
              <div className='lg:col-span-5 space-y-4'>
                <div className='flex items-center gap-3'>
                  <Gopuram size={56} />
                  <div>
                    <span className={`text-sm font-bold text-[#8A672F] tracking-wider block ${C}`}>
                      Ceremony · {p.ceremony.shortDate} · {p.ceremony.time}
                    </span>
                    <h3 className={`text-2xl sm:text-3xl font-semibold leading-tight text-[#6E0B18] ${D}`}>{p.ceremony.venue}</h3>
                  </div>
                </div>
                <div className={`space-y-1 text-base text-[#3E2214] border-l-2 border-[#D4AF37] pl-3 ${D}`}>
                  <p className='font-semibold'>{p.ceremony.street}</p>
                  <p>{p.ceremony.city}, {p.ceremony.state}</p>
                  <p className='text-sm italic text-[#8A672F]'>Landmark: {p.ceremony.landmark}</p>
                </div>
                <div className='flex flex-wrap items-center gap-2 pt-1'>
                  <a
                    href={p.ceremony.googleMapsUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className={`inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full border-2 border-[#FFE8A3] bg-gradient-to-b from-[#8A1426] to-[#5A0813] text-[#FFE8A3] text-sm sm:text-base font-semibold shadow-md hover:from-[#A3162B] transition-transform active:scale-95 ${C}`}
                  >
                    <MapPin className='w-4 h-4' />
                    <span>Get directions</span>
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${p.ceremony.venue}, ${p.ceremony.fullAddress}`);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 3000);
                    }}
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/80 border border-[#D4AF37] text-[#6E0B18] text-sm sm:text-base font-semibold transition hover:bg-white shadow-xs ${D}`}
                  >
                    {copied ? <Check className='w-4 h-4 text-green-700' /> : <Copy className='w-4 h-4 text-[#8A672F]' />}
                    <span>{copied ? 'Copied' : 'Copy address'}</span>
                  </button>
                </div>
              </div>
              <div className='lg:col-span-7 h-[230px] sm:h-[330px] rounded-xl overflow-hidden border-2 border-[#D4AF37] relative shadow-inner'>
                <iframe title='Ceremony Location' src={p.ceremony.embedMapUrl} className='w-full h-full border-0' loading='lazy' allowFullScreen />
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
};

/* =====================================================================
   ABOUT
   ===================================================================== */

const About = () => (
  <Section id='about' tone='dark' art='temple'>
    <Reveal className='max-w-2xl mx-auto'>
      <Heading en='A Beautiful Future Together' dark />
      <div className='mt-4 rounded-2xl bg-gradient-to-b from-[#FFFDF9] to-[#F7ECD8] p-1.5 ring-2 ring-[#D4AF37] shadow-[0_24px_60px_rgba(0,0,0,0.5)]'>
        <div className='relative overflow-hidden rounded-xl border border-[#D4AF37] px-5 py-7 sm:px-10 sm:py-10'>
          <Mandala className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] opacity-[0.1] pointer-events-none' />
          <p className={`relative text-xl sm:text-2xl italic leading-relaxed text-[#3E2214] font-medium ${D}`}>
            “Bound by love and the blessings of their families, {p.couple.brideShort} and {p.couple.groomShort} begin their journey together. As they step into this new chapter hand in hand, may their home be filled with joy, warmth, laughter, and a lifetime of togetherness.”
          </p>
          <p className={`relative mt-4 text-base font-bold text-[#8A672F] tracking-wide ${C}`}>
            “Move together, speak together.” Rig Veda 10.191.2
          </p>
        </div>
      </div>
    </Reveal>
  </Section>
);

/* =====================================================================
   GALLERY (three-photo heirloom)
   ===================================================================== */

const Gallery = () => {
  const [index, setIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const items = p.photoWall.slots;
  const close = () => setIndex(null);
  const next = useCallback(() => setIndex((i) => (i === null ? i : (i + 1) % items.length)), [items.length]);
  const prev = useCallback(() => setIndex((i) => (i === null ? i : (i - 1 + items.length) % items.length)), [items.length]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') close();
      if (ev.key === 'ArrowRight') next();
      if (ev.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, next, prev]);

  return (
    <Section id='gallery' art='mandala'>
      <Reveal className='max-w-5xl mx-auto text-center'>
        <Heading en={p.photoWall.title} />
        <p className={`-mt-1 text-base sm:text-lg italic text-[#5B3A2A] max-w-lg mx-auto ${D}`}>{p.photoWall.subtitle}</p>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-6 my-10 max-w-3xl mx-auto items-end'>
          {items.map((item, idx) => {
            const isCenter = false;
            const rotations = ['md:-rotate-1 hover:rotate-0', 'md:rotate-1 hover:rotate-0'];
            return (
              <button
                key={item.id}
                type='button'
                onClick={() => setIndex(idx)}
                aria-label={`Open ${item.title}`}
                className={`group relative text-left w-full transition-all duration-500 transform ${rotations[idx]} ${isCenter ? 'md:-translate-y-4' : 'opacity-95 hover:opacity-100'}`}
              >
                <div className='relative rounded-t-[72px] rounded-b-2xl bg-gradient-to-b from-[#FFFDF9] via-[#FAF3E0] to-[#F5E6CC] p-3 shadow-[0_16px_40px_rgba(110,11,24,0.18)] border-2 border-[#D4AF37]'>
                  <div className='absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#6E0B18]/60 rounded-tl' />
                  <div className='absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#6E0B18]/60 rounded-tr' />
                  <div className='absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#6E0B18]/60 rounded-bl' />
                  <div className='absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#6E0B18]/60 rounded-br' />

                  <div className='relative rounded-t-[64px] rounded-b-xl border border-dashed border-[#D4AF37] p-2 overflow-hidden bg-[#FAF3E0]/70'>
                    <div className='relative aspect-[4/5] w-full overflow-hidden rounded-t-[56px] rounded-b-lg border border-[#D4AF37]/80 bg-[#42050E]/10'>
                      <img src={item.src} alt={item.title} loading='lazy' className='w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105' />
                      <div className='absolute inset-0 bg-gradient-to-t from-[#42050E]/90 via-[#42050E]/20 to-transparent' />
                      <div className='absolute top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#6E0B18]/90 border border-[#D4AF37] text-[10px] font-bold uppercase tracking-widest text-[#FFE8A3]'>
                        0{idx + 1}
                      </div>
                      <div className='absolute bottom-3 inset-x-3 text-center'>
                        <h4 className={`text-lg sm:text-xl font-bold text-[#FFE8A3] drop-shadow-md leading-tight ${C}`}>{item.title}</h4>
                        <div className='w-12 h-[1px] bg-[#D4AF37]/70 mx-auto my-1' />
                        <p className='text-xs italic text-[#FFFDF9]/90'>{item.caption}</p>
                      </div>
                    </div>
                  </div>

                  <div className='absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#6E0B18] border-2 border-[#D4AF37] shadow-md flex items-center justify-center'>
                    <div className='w-1.5 h-1.5 rounded-full bg-[#FFE8A3]' />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Reveal>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {index !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={close}
                className='fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-[#38040C]/95 backdrop-blur-md select-none'
              >
                <div
                  className='relative max-w-3xl w-full flex flex-col items-center p-4 sm:p-6 rounded-2xl bg-[#FFFDF9] border-2 border-[#D4AF37] shadow-[0_24px_60px_rgba(0,0,0,0.6)]'
                  onClick={(ev) => ev.stopPropagation()}
                >
                  <button
                    onClick={close}
                    aria-label='Close'
                    className='absolute top-3 right-3 z-30 w-9 h-9 rounded-full bg-[#6E0B18] border border-[#D4AF37] text-[#FFE8A3] flex items-center justify-center hover:bg-[#D4AF37] hover:text-[#42050E] transition-colors shadow-md'
                  >
                    <X className='w-5 h-5' />
                  </button>

                  <div className='relative w-full max-h-[72vh] overflow-hidden rounded-xl border-2 border-[#D4AF37]/80 bg-[#42050E]/10 flex items-center justify-center'>
                    <img src={items[index].src} alt={items[index].title} className='w-full h-auto max-h-[72vh] object-contain rounded-lg' />
                  </div>

                  <div className='w-full mt-4 flex items-center justify-between px-2'>
                    <div className='text-left'>
                      <h3 className={`text-lg sm:text-xl font-bold text-[#6E0B18] ${C}`}>{items[index].title}</h3>
                      <p className='text-xs italic text-[#5B3A2A]'>{items[index].caption}</p>
                    </div>
                    <div className='flex items-center gap-3'>
                      <button
                        onClick={prev}
                        aria-label='Previous photo'
                        className='w-9 h-9 rounded-full bg-[#6E0B18] border border-[#D4AF37] text-[#FFE8A3] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform'
                      >
                        <ChevronLeft className='w-5 h-5' />
                      </button>
                      <span className={`text-sm sm:text-base font-bold text-[#6E0B18] min-w-[48px] text-center ${C}`}>{index + 1} / 3</span>
                      <button
                        onClick={next}
                        aria-label='Next photo'
                        className='w-9 h-9 rounded-full bg-[#6E0B18] border border-[#D4AF37] text-[#FFE8A3] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform'
                      >
                        <ChevronRight className='w-5 h-5' />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </Section>
  );
};

/* =====================================================================
   JOIN INITIALS (S and M)
   ===================================================================== */

const Join = ({
  onJoined,
  isJoined,
}: {
  onJoined?: () => void;
  onReset?: () => void;
  isJoined?: boolean;
}) => {
  const [local, setLocal] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [range, setRange] = useState(200);
  const joined = isJoined !== undefined ? isJoined : local;

  useEffect(() => {
    const update = () => {
      if (trackRef.current) setRange(Math.max(120, trackRef.current.clientWidth - 94));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const complete = () => {
    if (!joined) {
      setLocal(true);
      onJoined?.();
      try {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#D4AF37', '#FFE8A3', '#8A672F', '#A3162B', '#FFFDF9'],
          disableForReducedMotion: true,
        });
      } catch { }
    }
  };

  return (
    <Section id='interactive-join' tone='dark' art='temple'>
      <Reveal className='max-w-xl mx-auto flex flex-col items-center'>
        <Heading en='Unite Their Initials' dark />
        <p className={`-mt-2 text-base sm:text-lg italic text-[#FFE8A3] max-w-md ${D}`}>
          {joined ? 'Two souls united in marriage' : 'Slide S towards M to unite their initials'}
        </p>
        {joined ? (
          <div className='w-full max-w-lg my-6 rounded-2xl bg-gradient-to-b from-[#FFFDF9] to-[#F7ECD8] p-1.5 ring-2 ring-[#D4AF37] shadow-[0_24px_60px_rgba(0,0,0,0.6)] text-[#3E2214]'>
            <div className='rounded-xl border border-[#D4AF37] px-4 py-8 sm:px-9 flex flex-col items-center'>
              <MandapCouple size={96} className='text-[#6E0B18] mb-1' />
              <h3 className={`text-2xl sm:text-3xl font-semibold text-[#6E0B18] ${C}`}>Join us in celebrating</h3>
              <p className={`text-3xl sm:text-5xl font-bold text-[#6E0B18] mt-2 ${C}`}>{p.couple.displayNames}</p>
              <Divider className='my-3' />
              <p className={`text-lg italic text-[#5B3A2A] ${D}`}>{p.invitationMessage.guestWelcomeHeading}</p>
            </div>
          </div>
        ) : (
          <div className='w-full max-w-sm sm:max-w-md my-6 px-1 sm:px-2'>
            <div
              ref={trackRef}
              className='relative h-20 sm:h-28 rounded-full bg-[#38040C]/90 border-2 border-[#D4AF37] shadow-inner flex items-center px-2.5 sm:px-3.5 overflow-hidden'
            >
              <div className='absolute right-2.5 sm:right-3.5 w-14 h-14 sm:w-20 sm:h-20 rounded-full border-2 border-dashed border-[#D4AF37] flex items-center justify-center bg-[#5A0813]/60'>
                <span className={`text-2xl sm:text-4xl font-bold text-[#FFE8A3] ${C}`}>M</span>
              </div>
              <motion.div
                drag='x'
                dragConstraints={{ left: 0, right: range }}
                dragElastic={0.15}
                onDragEnd={(_, info) => {
                  if (info.offset.x >= range * 0.6) complete();
                }}
                className='relative z-20 w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#FFE8A3] via-[#D4AF37] to-[#8A672F] border-2 border-[#FFE8A3] shadow-lg cursor-grab active:cursor-grabbing flex items-center justify-center touch-none'
              >
                <span className={`text-2xl sm:text-4xl font-bold text-[#42050E] ${C}`}>S</span>
              </motion.div>
            </div>
          </div>
        )}
      </Reveal>
    </Section>
  );
};

/* =====================================================================
   FOOTER
   ===================================================================== */

const Footer = () => {
  return (
    <Section id='blessings' art='temple' className='!pb-28 sm:!pb-36'>
      <Reveal className='max-w-xl mx-auto flex flex-col items-center'>
        <MandapCouple size={150} className='text-[#6E0B18]' />
        <p className={`mt-3 text-xl sm:text-2xl font-bold text-[#8A672F] ${T}`}>நன்றி</p>
        <p className={`mt-3 text-xl sm:text-2xl italic text-[#3E2214] leading-relaxed font-medium ${D}`}>“{p.scriptures.blessingVerse}”</p>
        <p className={`mt-1 text-sm font-bold text-[#8A672F] tracking-wider uppercase ${C}`}>{p.scriptures.blessingRef}</p>
        <Divider />
        <p className={`text-3xl sm:text-4xl font-semibold text-[#6E0B18] ${C}`}>{p.couple.displayNames}</p>
        <p className={`mt-2 text-base text-[#5B3A2A] ${D}`}>{p.invitationMessage.closingBody}</p>
      </Reveal>
      <TempleBorder className='absolute bottom-0 inset-x-0 z-10' />
    </Section>
  );
};

/* =====================================================================
   MUSIC TOGGLE & ROSE PETAL DRIFT
   ===================================================================== */

const MusicToggle = () => {
  const [playing, setPlaying] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const unsub = audio.subscribe((st) => setPlaying(st));
    return () => unsub();
  }, []);

  if (!mounted) return null;

  return (
    <div className='fixed z-50 select-none bottom-5 right-5'>
      <button
        onClick={() => audio.toggle()}
        aria-label={playing ? 'Mute music' : 'Play music'}
        className='w-12 h-12 rounded-full bg-gradient-to-b from-[#8A1426] to-[#5A0813] border-2 border-[#FFE8A3] shadow-[0_4px_16px_rgba(0,0,0,0.4)] flex items-center justify-center transition hover:scale-105 active:scale-90'
      >
        {playing ? <Volume2 className='w-5 h-5 text-[#FFE8A3]' /> : <VolumeX className='w-5 h-5 text-[#FFE8A3]/70' />}
      </button>
    </div>
  );
};

const RealisticFlowerShower = ({ active = true }: { active?: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    let animId = 0;

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const palettes = [
      { base: '#7A0D23', highlight: '#A81434', shadow: '#3D030F', rim: 'rgba(255, 205, 210, 0.25)' },
      { base: '#99112C', highlight: '#C2185B', shadow: '#4A0514', rim: 'rgba(252, 228, 236, 0.35)' },
      { base: '#880E4F', highlight: '#AD1457', shadow: '#38040C', rim: 'rgba(248, 187, 208, 0.2)' },
    ];

    const count = w < 768 ? 9 : 25;
    const petals = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 6 + 9,
      speedY: Math.random() * 0.28 + 0.18,
      speedX: (Math.random() - 0.5) * 0.15,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.008,
      pitch: Math.random() * Math.PI,
      pitchSpeed: Math.random() * 0.012 + 0.006,
      roll: Math.random() * Math.PI,
      rollSpeed: Math.random() * 0.01 + 0.005,
      swayOffset: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.01 + 0.006,
      opacity: Math.random() * 0.25 + 0.45,
      palette: palettes[Math.floor(Math.random() * palettes.length)],
    }));

    let frame = 0;
    const render = () => {
      ctx.clearRect(0, 0, w, h);
      frame += 0.01;

      petals.forEach((pt) => {
        pt.y += pt.speedY;
        pt.x += Math.sin(frame * pt.swaySpeed * 60 + pt.swayOffset) * 0.45 + pt.speedX;
        pt.rotation += pt.rotationSpeed;
        pt.pitch += pt.pitchSpeed;
        pt.roll += pt.rollSpeed;

        if (pt.y > h + 30) {
          pt.y = -30;
          pt.x = Math.random() * w;
        }
        if (pt.x < -30) pt.x = w + 30;
        if (pt.x > w + 30) pt.x = -30;

        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.rotation);
        ctx.scale(Math.cos(pt.roll), Math.sin(pt.pitch));
        ctx.globalAlpha = pt.opacity;

        const s = pt.size;
        ctx.beginPath();
        ctx.moveTo(0, s * 0.95);
        ctx.bezierCurveTo(-s * 1.1, s * 0.35, -s * 0.95, -s * 0.65, -s * 0.15, -s);
        ctx.quadraticCurveTo(0, -s * 0.85, s * 0.15, -s);
        ctx.bezierCurveTo(s * 0.95, -s * 0.65, s * 1.1, s * 0.35, 0, s * 0.95);
        ctx.closePath();

        const grad = ctx.createRadialGradient(0, -s * 0.15, s * 0.1, 0, 0, s * 1.1);
        grad.addColorStop(0, pt.palette.highlight);
        grad.addColorStop(0.5, pt.palette.base);
        grad.addColorStop(1, pt.palette.shadow);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = pt.palette.rim;
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
    };
  }, [active]);

  return <canvas ref={canvasRef} className='fixed inset-0 pointer-events-none z-20' aria-hidden='true' />;
};

/* =====================================================================
   PAGE
   ===================================================================== */

export default function WeddingInvitationPage() {
  const [entered, setEntered] = useState(false);
  const [joined, setJoined] = useState(false);

  return (
    <main className='relative min-h-screen bg-[#FFFDF9] text-[#3E2214] selection:bg-[#D4AF37]/30 selection:text-[#6E0B18] overflow-x-hidden'>
      <RealisticFlowerShower active />
      {entered && <MusicToggle />}
      <AnimatePresence>
        {!entered && (
          <Entrance
            onEnter={() => {
              setEntered(true);
              setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }, 100);
            }}
          />
        )}
      </AnimatePresence>
      <div className={`transition-opacity duration-1000 ease-out ${entered ? 'opacity-100' : 'opacity-0 pointer-events-none h-screen overflow-hidden'}`}>
        <Hero />
        <Envelope />
        <Venue />
        <About />
        <Gallery />
        <Join onJoined={() => setJoined(true)} onReset={() => setJoined(false)} isJoined={joined} />
        <Footer />
      </div>
    </main>
  );
}