import { SVGProps } from 'react';

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
  strokeWidth?: number;
}

const Icon = ({ children, size = 20, strokeWidth = 1.5, ...props }: IconProps & { children: React.ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    strokeWidth={strokeWidth} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"
    {...props}>
    {children}
  </svg>
);

export const IconScan = (p: IconProps) => <Icon {...p}><path d="M3 7V5a2 2 0 012-2h2M17 7V5a2 2 0 00-2-2h-2M3 13v2a2 2 0 002 2h2M17 13v2a2 2 0 01-2 2h-2"/><circle cx="10" cy="10" r="3"/></Icon>;
export const IconHistory = (p: IconProps) => <Icon {...p}><path d="M3 10a7 7 0 107-7c-2 0-3.8 1-5 2.5"/><path d="M3 3v3h3"/><path d="M10 7v3l2 1.5"/></Icon>;
export const IconHome = (p: IconProps) => <Icon {...p}><path d="M3 8.5L10 3l7 5.5V16a1 1 0 01-1 1h-3v-5H8v5H4a1 1 0 01-1-1V8.5z"/></Icon>;
export const IconUser = (p: IconProps) => <Icon {...p}><circle cx="10" cy="7" r="3"/><path d="M4 17c0-3 2.5-5 6-5s6 2 6 5"/></Icon>;
export const IconArrow = (p: IconProps) => <Icon {...p}><path d="M4 10h12M12 6l4 4-4 4"/></Icon>;
export const IconArrowLeft = (p: IconProps) => <Icon {...p}><path d="M16 10H4M8 6l-4 4 4 4"/></Icon>;
export const IconCheck = (p: IconProps) => <Icon {...p}><path d="M4 10l4 4 8-8"/></Icon>;
export const IconX = (p: IconProps) => <Icon {...p}><path d="M5 5l10 10M15 5L5 15"/></Icon>;
export const IconChevron = (p: IconProps) => <Icon {...p}><path d="M7 5l5 5-5 5"/></Icon>;
export const IconChevronDown = (p: IconProps) => <Icon {...p}><path d="M5 8l5 5 5-5"/></Icon>;
export const IconInfo = (p: IconProps) => <Icon {...p}><circle cx="10" cy="10" r="7.5"/><path d="M10 9v4M10 6.5v.5"/></Icon>;
export const IconShield = (p: IconProps) => <Icon {...p}><path d="M10 2l6 2v5c0 4-3 7-6 9-3-2-6-5-6-9V4l6-2z"/></Icon>;
export const IconDocument = (p: IconProps) => <Icon {...p}><path d="M5 2h7l4 4v11a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M12 2v4h4"/></Icon>;
export const IconDownload = (p: IconProps) => <Icon {...p}><path d="M10 3v10M6 9l4 4 4-4M3 16h14"/></Icon>;
export const IconTrash = (p: IconProps) => <Icon {...p}><path d="M3 5h14M7 5V3a1 1 0 011-1h4a1 1 0 011 1v2M5 5l1 12a1 1 0 001 1h6a1 1 0 001-1l1-12"/></Icon>;
export const IconCamera = (p: IconProps) => <Icon {...p}><path d="M3 7a2 2 0 012-2h2l1-2h4l1 2h2a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/><circle cx="10" cy="11" r="3"/></Icon>;

export const IconGoogle = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 18 18">
    <path d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 009 18z" fill="#34A853"/>
    <path d="M3.95 10.7A5.4 5.4 0 013.66 9c0-.59.1-1.16.29-1.7V4.96H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.04l2.99-2.33z" fill="#FBBC05"/>
    <path d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 00.96 4.96l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

export const AirscanMark = ({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color }}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L2 21h20L12 2z" stroke={color} strokeWidth="1.3" strokeLinejoin="round"/>
      <circle cx="12" cy="14.5" r="1.7" fill={color}/>
    </svg>
    <span style={{ fontFamily: 'Inter, system-ui', fontWeight: 600, fontSize: 15, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
      Airscan
    </span>
  </div>
);
