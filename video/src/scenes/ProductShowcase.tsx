import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    spring,
} from "remotion";

const products = [
    { id: "LX-001", name: "Minimal Jacket", price: "₵450" },
    { id: "LX-002", name: "Structure Dress", price: "₵320" },
    { id: "LX-003", name: "Essential Shirt", price: "₵180" },
    { id: "LX-004", name: "Clean Tee", price: "₵95" },
    { id: "LX-005", name: "Form Top", price: "₵220" },
    { id: "LX-006", name: "Line Skirt", price: "₵275" },
];

const ProductCard: React.FC<{
    product: (typeof products)[0];
    index: number;
    frame: number;
    fps: number;
}> = ({ product, index, frame, fps }) => {
    // Staggered entrance animation
    const delay = index * 8;
    const adjustedFrame = Math.max(0, frame - delay);

    const slideY = spring({
        frame: adjustedFrame,
        fps,
        config: { damping: 15, stiffness: 80 },
    });

    const opacity = interpolate(adjustedFrame, [0, 10], [0, 1], {
        extrapolateRight: "clamp",
    });

    // Grayscale to color transition (like the app's hover effect)
    const grayscale = interpolate(
        frame,
        [90, 120],
        [100, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    return (
        <div
            style={{
                width: 260,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                transform: `translateY(${(1 - slideY) * 60}px)`,
                opacity,
            }}
        >
            {/* Product image placeholder - grayscale like the app */}
            <div
                style={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    backgroundColor: "#f5f5f5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 32,
                    filter: `grayscale(${grayscale}%)`,
                }}
            >
                <div
                    style={{
                        width: "70%",
                        height: "70%",
                        backgroundColor: "#e0e0e0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <span style={{ fontSize: 48, opacity: 0.3 }}>👕</span>
                </div>
            </div>

            {/* Product ID - mono font */}
            <p
                style={{
                    fontSize: 10,
                    letterSpacing: "0.2em",
                    color: "#111317",
                    margin: 0,
                    marginTop: 20,
                    fontFamily: "'JetBrains Mono', monospace",
                    textTransform: "uppercase",
                }}
            >
                {product.id}
            </p>

            {/* Product name */}
            <p
                style={{
                    fontSize: 9,
                    letterSpacing: "0.1em",
                    color: "#111317",
                    margin: 0,
                    marginTop: 4,
                    fontFamily: "'JetBrains Mono', monospace",
                    textTransform: "uppercase",
                }}
            >
                {product.name}
            </p>
        </div>
    );
};

export const ProductShowcase: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Title animation
    const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
        extrapolateRight: "clamp",
    });

    const titleY = interpolate(frame, [0, 15], [-20, 0], {
        extrapolateRight: "clamp",
    });

    return (
        <AbsoluteFill
            style={{
                backgroundColor: "#ffffff",
                padding: 80,
                fontFamily: "'Inter', sans-serif",
            }}
        >
            {/* Category filter bar - like the app */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 48,
                    marginBottom: 60,
                    borderBottom: "1px solid #f0f2f4",
                    paddingBottom: 24,
                    opacity: titleOpacity,
                    transform: `translateY(${titleY}px)`,
                }}
            >
                {["ALL COLLECTION", "MENS", "WOMENS", "TOPS", "FOOTWEAR"].map((cat, i) => (
                    <span
                        key={cat}
                        style={{
                            fontSize: 10,
                            letterSpacing: "0.2em",
                            color: i === 0 ? "#16439c" : "rgba(17,19,23,0.4)",
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: 500,
                            borderBottom: i === 0 ? "1px solid #16439c" : "none",
                            paddingBottom: 4,
                        }}
                    >
                        {cat}
                    </span>
                ))}
            </div>

            {/* Product grid */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 24,
                    flexWrap: "wrap",
                }}
            >
                {products.map((product, index) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        index={index}
                        frame={frame}
                        fps={fps}
                    />
                ))}
            </div>
        </AbsoluteFill>
    );
};
