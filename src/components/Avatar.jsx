import { avatarHue, initials } from '../utils';

export default function Avatar({ id, name, size = 44, status }) {
  const hue = avatarHue(id);
  return (
    <span className={`avatar ${status ? `ring-${status}` : ''}`} style={{ width: size, height: size, fontSize: size * 0.38,
      background: `hsl(${hue} 55% 92%)`, color: `hsl(${hue} 55% 30%)` }}>
      {initials(name)}
    </span>
  );
}
