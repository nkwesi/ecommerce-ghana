import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    spring,
} from "remotion";

export const OutroScene: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // CTA animation
    const ctaScale = spring({
        frame,
        fps,
        config: { damping: 12, stiffness: 80 },
    });

    const ctaOpacity = interpolate(frame, [0, 15], [0, 1], {
        extrapolateRight: "clamp",
    });

    // URL fade in
    const urlOpacity = interpolate(frame, [20, 35], [0, 1], {
        extrapolateRight: "clamp",
    });

    // Minimal accent line
    const lineWidth = interpolate(frame, [10, 40], [0, 80], {
        extrapolateRight: "clamp",
    });

    // Fade out at the end
    const fadeOut = interpolate(frame, [70, 90], [1, 0], {
        extrapolateLeft: "clamp",
    });

    return (
        <AbsoluteFill
            style={{
                backgroundColor: "#ffffff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                opacity: fadeOut,
            }}
        >
            {/* Minimal accent line */}
            <div
                style={{
                    height: 2,
                    backgroundColor: "#16439c",
                    width: lineWidth,
                    marginBottom: 50,
                }}
            />

            {/* Main CTA */}
            <h1
                style={{
                    fontSize: 48,
                    fontWeight: 300,
                    color: "#111317",
                    margin: 0,
                    letterSpacing: "0.2em",
                    transform: `scale(${ctaScale})`,
                    opacity: ctaOpacity,
                    textAlign: "center",
                    fontFamily: "'Space Grotesk', sans-serif",
                    textTransform: "uppercase",
                }}
            >
                Explore Collection
            </h1>

            {/* URL */}
            <div
                style={{
                    marginTop: 40,
                    padding: "12px 32px",
                    border: "1px solid #16439c",
                    opacity: urlOpacity,
                }}
            >
                <p
                    style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: "#16439c",
                        margin: 0,
                        letterSpacing: "0.2em",
                        fontFamily: "'JetBrains Mono', monospace",
                        textTransform: "uppercase",
                    }}
                >
                    luxe-store.com
                </p>
            </div>

            {/* Tagline */}
            <p
                style={{
                    marginTop: 30,
                    fontSize: 10,
                    color: "rgba(17,19,23,0.4)",
                    letterSpacing: "0.25em",
                    opacity: urlOpacity,
                    fontFamily: "'JetBrains Mono', monospace",
                    textTransform: "uppercase",
                }}
            >
                Minimal • Curated • Essential
            </p>
        </AbsoluteFill>
    );
};
