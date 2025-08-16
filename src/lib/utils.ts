// src/lib/utils.ts

/**
 * Łączy klasy CSS w jednego stringa.
 * Użycie: cn("px-2", isActive && "text-red-500")
 */
export function cn(...args: (string | false | null | undefined)[]) {
  return args.filter(Boolean).join(' ');
}
