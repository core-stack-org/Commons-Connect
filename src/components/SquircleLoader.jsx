import React, { useEffect, useState } from "react";

const PerimeterProgress = ({
    progress,
    size = 28,
    strokeWidth = 3,
    backgroundColor = "#e2e8f0",
    progressColor = "#667eea",
    borderRadius = 5,
    animationDuration = 300,
    useSpring = false,
    style,
}) => {
    const [currentProgress, setCurrentProgress] = useState(0);

    const innerSize = size - strokeWidth;
    const halfStroke = strokeWidth / 2;

    const perimeter =
        4 * innerSize - 8 * borderRadius + 2 * Math.PI * borderRadius;

    useEffect(() => {
        const clampedProgress = Math.max(0, Math.min(100, progress));

        if (Math.abs(currentProgress - clampedProgress) < 0.1) return;

        const startValue = currentProgress;
        const startTime = Date.now();
        const duration = useSpring
            ? animationDuration * 1.2
            : animationDuration;

        const animate = () => {
            const elapsed = Date.now() - startTime;

            if (elapsed >= duration) {
                setCurrentProgress(clampedProgress);
                return;
            }

            const progress = elapsed / duration;
            let easedProgress;

            if (useSpring) {
                const c4 = (2 * Math.PI) / 3;
                easedProgress =
                    progress === 0
                        ? 0
                        : progress === 1
                          ? 1
                          : Math.pow(2, -10 * progress) *
                                Math.sin((progress * 10 - 0.75) * c4) +
                            1;
            } else {
                easedProgress = 1 - Math.pow(1 - progress, 3);
            }

            const currentValue =
                startValue + (clampedProgress - startValue) * easedProgress;
            setCurrentProgress(currentValue);

            requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }, [progress, useSpring, animationDuration, currentProgress]);

    const strokeDashoffset = ((100 - currentProgress) / 100) * perimeter;

    return (
        <svg width={size} height={size} style={style}>
            {/* Background */}
            <rect
                x={halfStroke}
                y={halfStroke}
                width={innerSize}
                height={innerSize}
                rx={borderRadius}
                ry={borderRadius}
                fill="none"
                stroke={backgroundColor}
                strokeWidth={strokeWidth}
            />

            {/* Progress */}
            <rect
                x={halfStroke}
                y={halfStroke}
                width={innerSize}
                height={innerSize}
                rx={borderRadius}
                ry={borderRadius}
                fill="none"
                stroke={progressColor}
                strokeWidth={strokeWidth}
                strokeDasharray={`${perimeter} ${perimeter}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
        </svg>
    );
};

const PerimeterProgressSquircle = (props) => {
    return (
        <PerimeterProgress
            {...props}
            borderRadius={props.size ? props.size * 0.18 : 5}
        />
    );
};

const SquircleLoader = ({
    size = 40,
    strokeWidth = 4,
    color = "#667eea",
    backgroundColor = "#e2e8f0",
    speed = 2000,
}) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => (prev >= 100 ? 0 : prev + 2));
        }, speed / 50);

        return () => clearInterval(interval);
    }, [speed]);

    return (
        <PerimeterProgressSquircle
            progress={progress}
            size={size}
            strokeWidth={strokeWidth}
            progressColor={color}
            backgroundColor={backgroundColor}
            animationDuration={speed / 25}
            useSpring={false}
        />
    );
};

export default SquircleLoader;
export { PerimeterProgressSquircle };
