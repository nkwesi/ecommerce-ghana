import { Composition } from "remotion";
import { DemoVideo } from "./Video";

export const RemotionRoot: React.FC = () => {
    return (
        <Composition
            id="Video"
            component={DemoVideo}
            durationInFrames={450} // 15 seconds at 30fps
            fps={30}
            width={1920}
            height={1080}
        />
    );
};
