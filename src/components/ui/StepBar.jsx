import PillButton from "./PillButton.jsx";

// Bottom control area for the map screens.
//   hint  — short text shown above the buttons (e.g. why the main action is disabled)
//   top   — full-width buttons stacked above the main row
//   back / main / next — the main row; main stretches to fill the remaining width
// Each button is { label, onClick, disabled, hidden, variant }.
const StepButton = ({ config, className }) => {
    if (!config || config.hidden) return null;
    const { label, variant, ...props } = config;
    return (
        <PillButton variant={variant} className={className} {...props}>
            <span className="truncate">{label}</span>
        </PillButton>
    );
};

const StepBar = ({ hint, top = [], back, main, next }) => (
    <div className="absolute left-0 w-full px-4 z-10 pointer-events-auto bottom-[calc(3.25rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-lg flex flex-col gap-3">
            {hint && (
                <p className="self-center max-w-full px-3 py-1 rounded-full bg-black/55 backdrop-blur-sm text-xs text-white text-center">
                    {hint}
                </p>
            )}

            {top.map((config, i) => (
                <StepButton key={i} config={config} className="w-full" />
            ))}

            {(back || main || next) && (
                <div className="flex gap-3 w-full">
                    <StepButton config={back} className="shrink-0" />
                    <StepButton config={main} className="flex-1 min-w-0" />
                    <StepButton config={next} className="shrink-0" />
                </div>
            )}
        </div>
    </div>
);

export default StepBar;
