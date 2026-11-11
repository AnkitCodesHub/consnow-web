// Same icons as res/drawable/ic_conn_*.xml (24×24, 2px stroke)
const base = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
export const PersonAdd = () => (<svg {...base}><path d="M16,21v-2a4,4 0,0 0,-4 -4H6a4,4 0,0 0,-4 4v2" /><path d="M9,3a4,4 0,1 0,0 8a4,4 0,1 0,0 -8z" /><path d="M19,8v6" /><path d="M22,11h-6" /></svg>);
export const PersonRemove = () => (<svg {...base}><path d="M16,21v-2a4,4 0,0 0,-4 -4H6a4,4 0,0 0,-4 4v2" /><path d="M9,3a4,4 0,1 0,0 8a4,4 0,1 0,0 -8z" /><path d="M22,11h-6" /></svg>);
export const Clock = () => (<svg {...base}><path d="M12,2a10,10 0,1 0,0 20a10,10 0,1 0,0 -20z" /><path d="M12,6v6l4,2" /></svg>);
export const Close = () => (<svg {...base}><path d="M18,6L6,18" /><path d="M6,6l12,12" /></svg>);
export const Check = () => (<svg {...base}><path d="M20,6L9,17l-5,-5" /></svg>);
export function Eye({ size = 22, color = '#2DD4BF', opacity = 1 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke={color} strokeOpacity={opacity} strokeWidth="9" strokeLinecap="round" aria-hidden="true">
      <path d="M8,50 Q50,2 92,50 Q50,98 8,50 Z" />
      <circle cx="50" cy="50" r="15" />
    </svg>
  );
}
