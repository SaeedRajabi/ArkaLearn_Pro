export function FigmaLogo({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M12 36c6.627 0 12-5.373 12-12v-6H12v6a6 6 0 01-12 0v-6a6 6 0 016-6h12V0H6C2.686 0 0 2.686 0 6v18c0 6.627 5.373 12 12 12z" fill="#0ACF83"/>
            <path d="M12 18a6 6 0 000-12H0v12a6 6 0 0012 6z" fill="#A259FF"/>
            <path d="M12 18c6.627 0 12-5.373 12-12S18.627 0 12 0v18z" fill="#F24E1E"/>
            <path d="M12 18a6 6 0 110-12 6 6 0 010 12z" fill="#FF7262"/>
        </svg>
    );
}
