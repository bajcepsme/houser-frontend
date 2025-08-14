// src/lib/softMarker.ts
import L from "leaflet";

// prosta konwersja #RRGGBB -> "r,g,b"
function hexToRgb(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return "37,99,235"; // default Blue-600
  return `${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)}`;
}

let cssInjected = false;
export function ensureSoftMarkerCss() {
  if (cssInjected) return;
  cssInjected = true;
  const s = document.createElement("style");
  s.innerHTML = `
    .softpin-wrap { }
    .softpin {
      position: relative;
      width: 36px; height: 36px;
      transform: translateZ(0);
    }
    .softpin__svg {
      position: absolute;
      left: 50%; top: 1px;
      transform: translateX(-50%);
      filter: drop-shadow(0 6px 14px rgba(0,0,0,.18));
      transition: filter .25s ease, transform .25s ease;
    }
    .softpin__pulse {
      position: absolute;
      left: 50%; bottom: 6px;
      width: 2px; height: 2px;
      transform: translateX(-50%);
      border-radius: 999px;
      box-shadow: 0 0 0 0 rgba(var(--pin-rgb,37,99,235), .34);
      animation: softpin-pulse 1.9s ease-out infinite;
    }
    .softpin__shadow {
      position: absolute;
      left: 50%; bottom: 3px;
      width: 22px; height: 8px;
      transform: translateX(-50%);
      border-radius: 50%;
      background: radial-gradient(ellipse at center, rgba(0,0,0,.25), rgba(0,0,0,0) 70%);
      filter: blur(2px);
      opacity: .55;
      transition: opacity .25s ease, transform .25s ease;
    }
    .softpin--active .softpin__svg {
      transform: translateX(-50%) scale(1.08);
      filter: drop-shadow(0 10px 20px rgba(0,0,0,.22));
    }
    .softpin--active .softpin__shadow {
      opacity: .7; transform: translateX(-50%) scaleX(1.05);
    }
    @keyframes softpin-pulse {
      0%   { box-shadow: 0 0 0 0   rgba(var(--pin-rgb,37,99,235), .34); }
      70%  { box-shadow: 0 0 0 14px rgba(var(--pin-rgb,37,99,235), 0); }
      100% { box-shadow: 0 0 0 0   rgba(var(--pin-rgb,37,99,235), 0); }
    }
  `;
  document.head.appendChild(s);
}

export function softPinIcon({
  color = "#2563EB", // Blue-600; zmień np. na łososiowy #FF8A65
  active = false,
}: { color?: string; active?: boolean }) {
  const rgb = hexToRgb(color);
  const html = `
    <div class="softpin ${active ? "softpin--active" : ""}" style="--pin-rgb:${rgb}">
      <div class="softpin__shadow"></div>
      <svg class="softpin__svg" width="28" height="34" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <!-- klasyczny, nierotowany pin -->
        <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8z" fill="${color}"/>
        <circle cx="12" cy="10" r="3" fill="#fff"/>
      </svg>
      <span class="softpin__pulse"></span>
    </div>
  `;
  return L.divIcon({
    className: "softpin-wrap",
    html,
    iconSize: [36, 36],
    iconAnchor: [18, 34],
    popupAnchor: [0, -28],
  });
}
