export function AngularLogo({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 250 250"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M125 0L25 40.41 43.75 187.5 125 250l81.25-62.5L225 40.41 125 0z" fill="#DD0031" />
            <path d="M125 0v250l81.25-62.5L225 40.41 125 0z" fill="#C3002F" />
            <path d="M125 53.13L68.75 162.5h25L125 96.88l31.25 65.62h25L125 53.13z" fill="#fff" />
        </svg>
    );
}
