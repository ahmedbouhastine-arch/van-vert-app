import { cn } from "@/lib/utils";

const AVATAR_GRADIENTS = [
  ["#002d78", "#0078a5"],
  ["#0078a5", "#0087a5"],
  ["#16a34a", "#0078a5"],
  ["#b45309", "#dc2626"],
  ["#7c3aed", "#0078a5"],
];

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
}

function initialsFor(name?: string | null, email?: string | null) {
  if (name) {
    return name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  return (email || "?").charAt(0).toUpperCase();
}

export function VvAvatar({
  name,
  email,
  size = 36,
  className,
}: {
  name?: string | null;
  email?: string | null;
  size?: number;
  className?: string;
}) {
  const text = initialsFor(name, email);
  const key = name || email || "x";
  const [from, to] = AVATAR_GRADIENTS[hashStr(key) % AVATAR_GRADIENTS.length];

  return (
    <div
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-outfit font-semibold text-white", className)}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        letterSpacing: "-0.01em",
        background: `linear-gradient(135deg, ${from}, ${to})`,
      }}
    >
      {text}
    </div>
  );
}
