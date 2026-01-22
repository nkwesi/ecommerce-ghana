import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    spring,
    staticFile,
    Img,
} from "remotion";

// 12 unique products - 2 rows of 6
const products = [
    // Row 1
    { id: "LX-001", name: "Minimal Jacket", image: "jacket.png" },
    { id: "LX-002", name: "Structure Dress", image: "dress.png" },
    { id: "LX-003", name: "Essential Shirt", image: "shirt.png" },
    { id: "LX-004", name: "Clean Tee", image: "tee.png" },
    { id: "LX-005", name: "Form Top", image: "top.png" },
    { id: "LX-006", name: "Line Skirt", image: "skirt.png" },
    // Row 2 - all unique items
    { id: "LX-007", name: "Camel Coat", image: "coat.png" },
    { id: "LX-008", name: "Tailored Pants", image: "pants.png" },
    { id: "LX-009", name: "Knit Sweater", image: "sweater.png" },
    { id: "LX-010", name: "Wool Blazer", image: "blazer.png" },
    { id: "LX-011", name: "Navy Cardigan", image: "cardigan.png" },
    { id: "LX-012", name: "Classic Shorts", image: "shorts.png" },
];

const ProductCard: React.FC<{
    product: (typeof products)[0];
    index: number;
    frame: number;
    fps: number;
}> = ({ product, index, frame, fps }) => {
    // Staggered entrance - row by row
    const row = Math.floor(index / 6);
    const col = index % 6;
    const delay = row * 15 + col * 5;
    const adjustedFrame = Math.max(0, frame - delay);

    const slideY = spring({
        frame: adjustedFrame,
        fps,
        config: { damping: 15, stiffness: 80 },
    });

    const opacity = interpolate(adjustedFrame, [0, 10], [0, 1], {
        extrapolateRight: "clamp",
    });

    // Grayscale to color transition
    const grayscale = interpolate(
        frame,
        [80, 110],
        [100, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    return (
        <div
            style={{
                width: 280,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                transform: `translateY(${(1 - slideY) * 50}px)`,
                opacity,
            }}
        >
            {/* Product image */}
            <div
                style={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    backgroundColor: "#f5f5f5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 20,
                    overflow: "hidden",
                }}
            >
                <Img
                    src={staticFile(product.image)}
                    style={{
                        width: "85%",
                        height: "85%",
                        objectFit: "contain",
                        filter: `grayscale(${grayscale}%)`,
                        transform: "scale(0.92)",
                    }}
                />
            </div>

            {/* Product ID */}
            <p
                style={{
                    fontSize: 20,
                    letterSpacing: "0.15em",
                    color: "#111317",
                    margin: 0,
                    marginTop: 18,
                    fontFamily: "'JetBrains Mono', monospace",
                    textTransform: "uppercase",
                    fontWeight: 500,
                }}
            >
                {product.id}
            </p>

            {/* Product name */}
            <p
                style={{
                    fontSize: 18,
                    letterSpacing: "0.1em",
                    color: "#111317",
                    margin: 0,
                    marginTop: 8,
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
                padding: "50px 60px",
                fontFamily: "'Inter', sans-serif",
            }}
        >
            {/* Category filter bar */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 48,
                    marginBottom: 40,
                    borderBottom: "1px solid #f0f2f4",
                    paddingBottom: 20,
                    opacity: titleOpacity,
                    transform: `translateY(${titleY}px)`,
                }}
            >
                {["ALL COLLECTION", "MENS", "WOMENS", "TOPS", "FOOTWEAR", "ACCESSORIES"].map((cat, i) => (
                    <span
                        key={cat}
                        style={{
                            fontSize: 20,
                            letterSpacing: "0.15em",
                            color: i === 0 ? "#16439c" : "rgba(17,19,23,0.5)",
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: 500,
                            borderBottom: i === 0 ? "3px solid #16439c" : "none",
                            paddingBottom: 8,
                        }}
                    >
                        {cat}
                    </span>
                ))}
            </div>

            {/* Product grid - 2 rows */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(6, 1fr)",
                    gap: "30px 20px",
                    justifyItems: "center",
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
