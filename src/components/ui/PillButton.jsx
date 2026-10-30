const VARIANTS = {
    primary: "bg-sand text-plum",
    success: "bg-[#2E7D32] text-white",
};

const SHAPES = {
    pill: "rounded-full",
    xl: "rounded-xl",
};

// Shared map-overlay button: brand colours, 44px touch target, readable disabled state.
const PillButton = ({
    variant = "primary",
    shape = "pill",
    className = "",
    children,
    ...props
}) => (
    <button
        type="button"
        className={`h-11 px-4 text-sm font-medium flex items-center justify-center whitespace-nowrap shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-200 cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:active:scale-100 disabled:bg-muted disabled:text-muted-fg ${VARIANTS[variant]} ${SHAPES[shape]} ${className}`}
        {...props}
    >
        {children}
    </button>
);

export default PillButton;
