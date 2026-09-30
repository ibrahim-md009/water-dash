import { Droplet } from 'lucide-react';

export default function Logo({ size = 40 }) {
  return (
    <span className="logo-mark" style={{ width: size, height: size }} aria-hidden="true">
      <Droplet size={Math.round(size * 0.55)} fill="currentColor" strokeWidth={1.5} />
    </span>
  );
}
