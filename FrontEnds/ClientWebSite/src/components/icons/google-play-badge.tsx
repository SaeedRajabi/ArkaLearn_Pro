export function GooglePlayBadge({ className }: { className?: string }) {
    return (
        <a href="#" aria-label="Get it on Google Play" className={className}>
            <svg width="150" height="45" viewBox="0 0 168 51" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="167.999" height="50.7208" rx="10.8" fill="black"/>
                <path d="M24.2985 10.4285L32.6185 15.6845L24.2985 20.9405V10.4285Z" fill="#FFD947"/>
                <path d="M24.2985 20.9405L32.6185 15.6845L44.0265 22.2965L39.6945 25.0745L24.2985 20.9405Z" fill="#FFB454"/>
                <path d="M44.0264 29.0765L32.6184 25.6745L24.2984 40.9445L39.6944 36.2945L44.0264 29.0765Z" fill="#F44336"/>
                <path d="M24.2985 40.9444L32.6185 25.6744L44.0265 29.0764L39.6945 36.2944L24.2985 40.9444Z" fill="#4CAF50"/>
                <path d="M24.2985 10.4285V40.9445L39.6945 36.2945L44.0265 29.0765L44.0265 22.2965L39.6945 25.0745L24.2985 10.4285Z" fill="#FFC107"/>
                <text x="55" y="22" style={{fill: "white", fontSize: "11px", fontFamily: "sans-serif"}}>GET IT ON</text>
                <text x="55" y="40" style={{fill: "white", fontSize: "18px", fontWeight: 600, fontFamily: "sans-serif"}}>Google Play</text>
            </svg>
        </a>
    );
}
