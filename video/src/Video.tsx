import { AbsoluteFill, Series } from "remotion";
import { IntroScene } from "./scenes/IntroScene";
import { ProductShowcase } from "./scenes/ProductShowcase";
import { FeaturesScene } from "./scenes/FeaturesScene";
import { OutroScene } from "./scenes/OutroScene";

export const DemoVideo: React.FC = () => {
    return (
        <AbsoluteFill
            style={{
                backgroundColor: "#ffffff",
                fontFamily: "'Inter', sans-serif",
            }}
        >
            <Series>
                <Series.Sequence durationInFrames={90}>
                    <IntroScene />
                </Series.Sequence>
                <Series.Sequence durationInFrames={150}>
                    <ProductShowcase />
                </Series.Sequence>
                <Series.Sequence durationInFrames={120}>
                    <FeaturesScene />
                </Series.Sequence>
                <Series.Sequence durationInFrames={90}>
                    <OutroScene />
                </Series.Sequence>
            </Series>
        </AbsoluteFill>
    );
};
