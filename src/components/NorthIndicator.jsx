import { useEffect, useRef, useState } from "react";

const NorthIndicator = () => {
  const [heading, setHeading] = useState(null);
  const [supported, setSupported] = useState(false);
  const smoothHeading = useRef(0);
  const rafRef = useRef(null);
  const targetRef = useRef(0);
  const [displayAngle, setDisplayAngle] = useState(0);

  useEffect(() => {
    const handleOrientation = (e) => {
      let h;
      if (e.webkitCompassHeading != null) {
        h = e.webkitCompassHeading;
      } else if (e.alpha != null) {
        h = (360 - e.alpha) % 360;
      } else {
        return;
      }
      targetRef.current = h;
      setHeading(h);
      setSupported(true);
    };

    const requestPermission = async () => {
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function"
      ) {
        try {
          const perm = await DeviceOrientationEvent.requestPermission();
          if (perm === "granted") {
            window.addEventListener("deviceorientation", handleOrientation, true);
          }
        } catch {
          // permission denied or unavailable
        }
      } else if (typeof DeviceOrientationEvent !== "undefined") {
        window.addEventListener("deviceorientation", handleOrientation, true);
      }
    };

    requestPermission();

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation, true);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Smooth interpolation loop
  useEffect(() => {
    if (!supported) return;

    const lerp = (a, b, t) => {
      let diff = ((b - a + 540) % 360) - 180;
      return a + diff * t;
    };

    const tick = () => {
      smoothHeading.current = lerp(smoothHeading.current, targetRef.current, 0.12);
      setDisplayAngle(smoothHeading.current);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [supported]);

  return (
    <div
      className="flex flex-col items-center justify-center select-none"
      style={{ width: 36, height: 36 }}
    >
      <svg
        viewBox="0 0 36 36"
        width="36"
        height="36"
        style={{
          transform: supported ? `rotate(${-displayAngle}deg)` : undefined,
          transition: supported ? "none" : undefined,
          animation: supported ? undefined : "northBob 2.4s ease-in-out infinite",
          filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.45))",
        }}
      >
        {/* North arrow — red tip pointing up (north) */}
        <polygon points="18,3 22,18 18,15 14,18" fill="#E53E3E" />
        {/* South half — white */}
        <polygon points="18,33 22,18 18,21 14,18" fill="#F7FAFC" opacity="0.9" />
        {/* Centre dot */}
        <circle cx="18" cy="18" r="2.5" fill="#1A202C" />
        {/* Outer ring */}
        <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" />
        {/* N label */}
        <text
          x="18"
          y="13"
          textAnchor="middle"
          fontSize="5"
          fontWeight="bold"
          fill="#E53E3E"
          fontFamily="sans-serif"
          style={{ userSelect: "none" }}
        >
          N
        </text>
      </svg>

      <style>{`
        @keyframes northBob {
          0%, 100% { transform: rotate(-8deg); }
          50%       { transform: rotate(8deg); }
        }
      `}</style>
    </div>
  );
};

export default NorthIndicator;
