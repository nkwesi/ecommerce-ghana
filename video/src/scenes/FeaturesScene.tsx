import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    spring,
} from "remotion";

// Custom SVG icons that work in Remotion
const SearchIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#16439c" strokeWidth="1.5">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
    </svg>
);

const BagIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#16439c" strokeWidth="1.5">
        <path d="M6 6h12l1 14H5L6 6z" strokeLinejoin="round" />
        <path d="M9 6V5a3 3 0 0 1 6 0v1" />
    </svg>
);

const ShippingIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#16439c" strokeWidth="1.5">
        <rect x="1" y="6" width="15" height="10" rx="1" />
        <path d="M16 10h4l3 4v4h-7v-8z" strokeLinejoin="round" />
        <circle cx="6" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
    </svg>
);

const features = [
    { icon: SearchIcon, title: "Smart Search", desc: "Find exactly what you need with intelligent product search" },
    { icon: BagIcon, title: "Easy Checkout", desc: "Secure payments with multiple options including mobile money" },
    { icon: ShippingIcon, title: "Fast Delivery", desc: "Quick and reliable shipping right to your doorstep" },
];

const FeatureItem: React.FC<{
    feature: (typeof features)[0];
    index: number;
    frame: number;
    fps: number;
}> = ({ feature, index, frame, fps }) => {
    const delay = 20 + index * 25;
    const adjustedFrame = Math.max(0, frame - delay);

    const scale = spring({
        frame: adjustedFrame,
        fps,
        config: { damping: 12, stiffness: 100 },
    });

    const opacity = interpolate(adjustedFrame, [0, 15], [0, 1], {
        extrapolateRight: "clamp",
    });

    const IconComponent = feature.icon;

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "48px 40px",
                gap: 28,
                transform: `scale(${scale})`,
                opacity,
                width: 340,
                backgroundColor: "#fafafa",
                border: "1px solid #f0f0f0",
            }}
        >
            {/* Icon container */}
            <div
                style={{
                    width: 100,
                    height: 100,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e8e8e8",
                }}
            >
                <IconComponent />
            </div>

            {/* Title */}
            <h3
                style={{
                    fontSize: 28,
                    fontWeight: 500,
                    color: "#111317",
                    margin: 0,
                    letterSpacing: "0.12em",
                    fontFamily: "'JetBrains Mono', monospace",
                    textTransform: "uppercase",
                }}
            >
                {feature.title}
            </h3>

            {/* Description */}
            <p
                style={{
                    fontSize: 22,
                    color: "rgba(17,19,23,0.65)",
                    margin: 0,
                    textAlign: "center",
                    fontFamily: "'Inter', sans-serif",
                    lineHeight: 1.5,
                    maxWidth: 300,
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

    const titleY = spring({
        frame,
        fps,
        config: { damping: 15, stiffness: 100 },
    });

    // Accent line animation
    const lineWidth = interpolate(frame, [5, 30], [0, 80], {
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
                padding: 80,
            }}
        >
            {/* Header section */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    marginBottom: 80,
                    opacity: titleOpacity,
                    transform: `translateY(${(1 - titleY) * -30}px)`,
                }}
            >
                {/* Accent line */}
                <div
                    style={{
                        width: lineWidth,
                        height: 2,
                        backgroundColor: "#16439c",
                        marginBottom: 32,
                    }}
                />

                {/* Section title */}
                <h2
                    style={{
                        fontSize: 26,
                        fontWeight: 500,
                        color: "#111317",
                        letterSpacing: "0.25em",
                        margin: 0,
                        fontFamily: "'JetBrains Mono', monospace",
                        textTransform: "uppercase",
                    }}
                >
                    Why Shop With Us
                </h2>

                {/* Subtitle */}
                <p
                    style={{
                        fontSize: 52,
                        fontWeight: 300,
                        color: "#111317",
                        letterSpacing: "0.04em",
                        margin: 0,
                        marginTop: 24,
                        fontFamily: "'Space Grotesk', sans-serif",
                    }}
                >
                    Curated experience, exceptional service
                </p>
            </div>

            {/* Features row */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 40,
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
        </AbsoluteFill>
    );
};
