import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    spring,
} from "remotion";

export const IntroScene: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Logo scale animation with spring
    const logoScale = spring({
        frame,
        fps,
        config: { damping: 12, stiffness: 100 },
    });

    // Logo opacity
    const logoOpacity = interpolate(frame, [0, 15], [0, 1], {
        extrapolateRight: "clamp",
    });

    // Tagline typewriter effect
    const tagline = "Curated Fashion Collection";
    const taglineProgress = interpolate(frame, [30, 70], [0, tagline.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });
    const visibleTagline = tagline.slice(0, Math.floor(taglineProgress));

    // Cursor blink for typewriter
    const cursorOpacity = Math.sin(frame * 0.3) > 0 ? 1 : 0;

    // Minimal accent line
    const lineWidth = interpolate(frame, [20, 50], [0, 120], {
        extrapolateRight: "clamp",
    });

    return (
        <AbsoluteFill
            style={{
                backgroundColor: "#ffffff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Space Grotesk', sans-serif",
            }}
        >
            {/* Minimal accent line */}
            <div
                style={{
                    position: "absolute",
                    top: "42%",
                    height: 2,
                    backgroundColor: "#16439c",
                    width: lineWidth,
                }}
            />

            {/* Main Logo */}
            <h1
                style={{
                    fontSize: 140,
                    fontWeight: 300,
                    letterSpacing: "0.4em",
                    color: "#111317",
                    margin: 0,
                    transform: `scale(${logoScale})`,
                    opacity: logoOpacity,
                    textTransform: "uppercase",
                    fontFamily: "'Space Grotesk', sans-serif",
                }}
            >
                LUXE
            </h1>

            {/* Tagline with typewriter - mono font */}
            <div
                style={{
                    marginTop: 40,
                    fontSize: 14,
                    letterSpacing: "0.25em",
                    color: "rgba(17,19,23,0.5)",
                    fontWeight: 400,
                    height: 30,
                    fontFamily: "'JetBrains Mono', monospace",
                    textTransform: "uppercase",
                }}
            >
                {visibleTagline}
                <span style={{ opacity: cursorOpacity, color: "#16439c" }}>|</span>
            </div>
        </AbsoluteFill>
    );
};
