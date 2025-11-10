export function PizzaBotIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Main Pizza Slice */}
            <path d="M 50,30 L 150,30 C 145,60 130,110 100,160 C 70,110 55,60 50,30 Z" fill="#FFD700" stroke="#E6A222" strokeWidth="4" strokeLinejoin="round"/>
            
            {/* Crust */}
            <path d="M 45,32 C 55,18 75,10 100,10 C 125,10 145,18 155,32 L 45,32 Z" fill="#F4B459" stroke="#C78835" strokeWidth="4" strokeLinejoin="round" />

            {/* Arm Left (Static) */}
            <g>
                <path d="M 60,85 C 40,95 30,115 45,125" fill="none" stroke="black" strokeWidth={6} />
                <g>
                    <path d="M35,135 C25,145 20,135 23,125 C30,110 45,115 45,125" fill="white" stroke="black" strokeWidth={2} />
                    <path d="M 33,125 a 5,3 0 0,1 0,-6" fill="none" stroke="black" strokeWidth={1.5} strokeLinecap="round" />
                    <path d="M 38,125 a 5,3 0 0,1 0,-6" fill="none" stroke="black" strokeWidth={1.5} strokeLinecap="round" />
                    <path d="M 43,125 a 5,3 0 0,1 0,-6" fill="none" stroke="black" strokeWidth={1.5} strokeLinecap="round" />
                </g>
            </g>
            
            {/* Arm Right (Waving) - CORRECTED */}
            <g transform="translate(5, 0)">
                <animateTransform attributeName="transform" type="rotate" values="0 140 85; -20 140 85; 0 140 85" dur="1.5s" repeatCount="indefinite" />
                <path d="M 140,85 C 150,75 165,70 160,50" fill="none" stroke="black" strokeWidth={6} />
                <g transform="translate(-5, -10)">
                    <path d="M170,55 C180,45 185,55 182,65 C175,80 160,75 160,65" fill="white" stroke="black" strokeWidth={2} />
                    <path d="M 168,65 a 5,3 0 0,0 0,-6" fill="none" stroke="black" strokeWidth={1.5} strokeLinecap="round" />
                    <path d="M 173,65 a 5,3 0 0,0 0,-6" fill="none" stroke="black" strokeWidth={1.5} strokeLinecap="round" />
                    <path d="M 178,65 a 5,3 0 0,0 0,-6" fill="none" stroke="black" strokeWidth={1.5} strokeLinecap="round" />
                </g>
            </g>

            {/* Legs */}
            <g id="pizzabot-legs">
                <path d="M 85,155 L 75,180" fill="none" stroke="black" strokeWidth={6} />
                <path d="M 115,155 L 125,180" fill="none" stroke="black" strokeWidth={6} />
                <ellipse cx="70" cy="180" rx="25" ry="10" fill="brown" stroke="black" strokeWidth={2} />
                <ellipse cx="130" cy="180" rx="25" ry="10" fill="brown" stroke="black" strokeWidth={2} />
            </g>

            {/* Face */}
            <g id="pizzabot-face">
                <ellipse cx="80" cy="75" rx="10" ry="15" fill="white" stroke="black" strokeWidth={2} />
                <circle cx="82" cy="78" r="5" fill="black" />
                <ellipse cx="120" cy="75" rx="10" ry="15" fill="white" stroke="black" strokeWidth={2} />
                <circle cx="118" cy="78" r="5" fill="black" />
                <path d="M 90,105 C 95,115 105,115 110,105" fill="none" stroke="black" strokeWidth={3} strokeLinecap="round" />
            </g>

            {/* Toppings */}
            <g id="pizzabot-toppings">
                <circle cx="100" cy="55" r="8" fill="#C0392B" stroke="#A52A2A" strokeWidth="1" />
                <circle cx="80" cy="125" r="8" fill="#C0392B" stroke="#A52A2A" strokeWidth="1" />
                <circle cx="120" cy="125" r="8" fill="#C0392B" stroke="#A52A2A" strokeWidth="1" />
            </g>
        </svg>
    );
}
