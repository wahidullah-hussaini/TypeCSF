/* Small inline SVG icon set (stroke icons, 24x24 grid). They inherit the text colour
   and are hidden from screen readers; the buttons that use them carry real labels. */
const make = (paths) =>
  function Icon({ className = 'size-5', ...rest }) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={className} {...rest}>
        {paths}
      </svg>
    );
  };

export const CheckIcon = make(<path d="M20 6 9 17l-5-5" />);
export const AlertIcon = make(<><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5h.01" /></>);
export const MenuIcon = make(<path d="M4 7h16M4 12h16M4 17h16" />);
export const CloseIcon = make(<path d="M6 6l12 12M18 6 6 18" />);
export const SearchIcon = make(<><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></>);
export const ChevronDownIcon = make(<path d="m6 9 6 6 6-6" />);
export const ChevronRightIcon = make(<path d="m9 6 6 6-6 6" />);
export const ChevronLeftIcon = make(<path d="m15 6-6 6 6 6" />);
export const LockIcon = make(<><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></>);
export const KeyboardIcon = make(<><rect x="2.5" y="6" width="19" height="12" rx="2.5" /><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" /></>);
export const VolumeIcon = make(<><path d="M4 10v4h4l5 4V6L8 10H4Z" /><path d="M16.5 9a4 4 0 0 1 0 6" /></>);
export const VolumeOffIcon = make(<><path d="M4 10v4h4l5 4V6L8 10H4Z" /><path d="m17 9 5 6M22 9l-5 6" /></>);
export const MoonIcon = make(<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />);
export const SunIcon = make(<><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" /></>);
export const GlobeIcon = make(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.6 2.6 4 5.7 4 9s-1.4 6.4-4 9c-2.6-2.6-4-5.7-4-9s1.4-6.4 4-9Z" /></>);
export const MailIcon = make(<><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m4 7 8 6 8-6" /></>);
export const SendIcon = make(<path d="m21 3-9.5 18-2.5-7.5L1.5 11 21 3ZM9 13.5 21 3" />);
export const ArrowRightIcon = make(<path d="M5 12h14m-6-6 6 6-6 6" />);
export const ArrowLeftIcon = make(<path d="M19 12H5m6-6-6 6 6 6" />);
export const KeysIcon = make(<><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M8 9h8M7 13h.01M12 13h.01M17 13h.01M9 16.5h6" /></>);
export const BookIcon = make(<><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" /><path d="M8 7h8M8 11h6" /></>);
export const GameIcon = make(<><rect x="2.5" y="7" width="19" height="11" rx="5" /><path d="M7.5 10.5v4M5.5 12.5h4M16 11.5h.01M18 13.5h.01" /></>);
export const QuizIcon = make(<><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1.9-1.1 1.8M12 17h.01" /></>);
export const ChartIcon = make(<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>);
export const GearIcon = make(<><circle cx="12" cy="12" r="3" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1" /></>);
export const UserIcon = make(<><circle cx="12" cy="8" r="4" /><path d="M4 21c.6-4.2 3.8-6 8-6s7.4 1.8 8 6" /></>);
export const InfoIcon = make(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.5h.01" /></>);
export const HomeIcon = make(<path d="m3 11 9-8 9 8M5.5 9.5V20h13V9.5M10 20v-6h4v6" />);
export const DownloadIcon = make(<path d="M12 3v12m-5-5 5 5 5-5M4 20h16" />);
export const UploadIcon = make(<path d="M12 15V3m-5 5 5-5 5 5M4 20h16" />);
export const TrophyIcon = make(<><path d="M7 4h10v5a5 5 0 0 1-10 0V4ZM7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5M12 14v4M8 21h8M9.5 18h5" /></>);
export const BoltIcon = make(<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />);
export const TargetIcon = make(<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>);
export const WifiOffIcon = make(<path d="M2 8.8a15 15 0 0 1 20 0M5 12.6a10 10 0 0 1 14 0M8.5 16.2a5 5 0 0 1 7 0M12 20h.01M3 3l18 18" />);
export const RefreshIcon = make(<><path d="M20 11a8 8 0 0 0-14.5-3.5L4 9M4 4v5h5M4 13a8 8 0 0 0 14.5 3.5L20 15M20 20v-5h-5" /></>);
export const SparkIcon = make(<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3ZM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" />);
export const PlayIcon = make(<path d="M7 4.5v15l12-7.5-12-7.5Z" />);

/* WhatsApp logo glyph (filled, 24x24 grid). */
export function WhatsAppIcon({ className = 'size-7', ...rest }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" className={className} {...rest}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
