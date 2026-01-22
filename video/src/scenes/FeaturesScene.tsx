import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    spring,
} from "remotion";

const features = [
    { icon: "search", title: "Smart Search", desc: "Find products instantly" },
    { icon: "shopping_bag", title: "Easy Checkout", desc: "Secure payments" },
    { icon: "local_shipping", title: "Fast Delivery", desc: "Quick shipping" },
];

const FeatureItem: React.FC<{
    feature: (typeof features)[0];
    index: number;
    frame: number;
    fps: number;
}> = ({ feature, index, frame, fps }) => {
    const delay = 15 + index * 20;
    const adjustedFrame = Math.max(0, frame - delay);

    const scale = spring({
        frame: adjustedFrame,
        fps,
        config: { damping: 12, stiffness: 100 },
    });

    const opacity = interpolate(adjustedFrame, [0, 10], [0, 1], {
        extrapolateRight: "clamp",
    });

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: 40,
                gap: 24,
                transform: `scale(${scale})`,
                opacity,
            }}
        >
            {/* Icon - minimal square button style like the app */}
            <div
                style={{
                    width: 80,
                    height: 80,
                    border: "1px solid #f0f2f4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#ffffff",
                }}
            >
                <span
                    style={{
                        fontFamily: "'Material Symbols Outlined'",
                        fontSize: 32,
                        color: "#111317",
                    }}
                >
                    {feature.icon}
                </span>
            </div>

            {/* Title */}
            <h3
                style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#111317",
                    margin: 0,
                    letterSpacing: "0.15em",
                    fontFamily: "'JetBrains Mono', monospace",
                    textTransform: "uppercase",
                }}
            >
                {feature.title}
            </h3>

            {/* Description */}
            <p
                style={{
                    fontSize: 12,
                    color: "rgba(17,19,23,0.5)",
                    margin: 0,
                    textAlign: "center",
                    fontFamily: "'Inter', sans-serif",
                }}
            >
                {feature.desc}
            </p>
        </div>
    );
};

export const FeaturesScene: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Title animation
    const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
        extrapolateRight: "clamp",
    });

    const titleScale = spring({
        frame,
        fps,
        config: { damping: 15, stiffness: 100 },
    });

    return (
        <AbsoluteFill
            style={{
                backgroundColor: "#ffffff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 60,
            }}
        >
            {/* Section title */}
            <h2
                style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#111317",
                    letterSpacing: "0.25em",
                    margin: 0,
                    marginBottom: 80,
                    opacity: titleOpacity,
                    transform: `scale(${titleScale})`,
                    fontFamily: "'JetBrains Mono', monospace",
                    textTransform: "uppercase",
                }}
            >
                WHY SHOP WITH US
            </h2>

            {/* Features row */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 120,
                }}
            >
                {features.map((feature, index) => (
                    <FeatureItem
                        key={feature.title}
                        feature={feature}
                        index={index}
                        frame={frame}
                        fps={fps}
                    />
                ))}
            </div>

            {/* Bottom accent line */}
            <div
                style={{
                    position: "absolute",
                    bottom: 100,
                    width: 60,
                    height: 2,
                    backgroundColor: "#16439c",
                }}
            />
        </AbsoluteFill>
    );
};
