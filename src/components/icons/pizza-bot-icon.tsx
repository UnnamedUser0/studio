export function PizzaBotIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Legs */}
            <g id="pizzabot-legs">
                <path d="M 85,155 L 75,180 L 55,180 L 65,155 Z" fill="#4A2A1A" />
                <path d="M 115,155 L 125,180 L 145,180 L 135,155 Z" fill="#4A2A1A" />
                <ellipse cx="65" cy="180" rx="20" ry="8" fill="brown" stroke="black" strokeWidth="2" />
                <ellipse cx="135" cy="180" rx="20" ry="8" fill="brown" stroke="black" strokeWidth="2" />
            </g>

            {/* Main Pizza Slice */}
            <path d="M 50,30 L 150,30 C 145,60 130,110 100,160 C 70,110 55,60 50,30 Z" fill="#FFD700" stroke="#E6A222" strokeWidth="4" strokeLinejoin="round"/>
            
            {/* Crust */}
            <path d="M 45,32 C 55,18 75,10 100,10 C 125,10 145,18 155,32 L 45,32 Z" fill="#F4B459" stroke="#C78835" strokeWidth="4" strokeLinejoin="round" />

             {/* Arm Left (Static) */}
            <g id="pizzabot-arm-left">
                <path d="M 60,90 C 40,100 30,120 45,130" fill="none" stroke="black" strokeWidth="6" />
                <circle cx="40" cy="132" r="15" fill="white" stroke="black" strokeWidth="2" />
                <path d="M 30,125 C 25,120 25,130 30,135" fill="white" stroke="black" strokeWidth="2" />
                 <path d="M 28,138 C 23,133 23,143 28,148" fill="white" stroke="black" strokeWidth="2" />
            </g>
            
            {/* Arm Right (Waving) */}
            <g id="pizzabot-arm" style={{ transformOrigin: '75px 85px' }}>
                <path d="M 140,80 C 160,70 175,80 170,100" fill="none" stroke="black" strokeWidth="6" />
                <circle cx="175" cy="105" r="15" fill="white" stroke="black" strokeWidth="2" />
                <path d="M 188,95 C 193,90 193,100 188,105" fill="white" stroke="black" strokeWidth="2" />
                <path d="M 190,110 C 195,105 195,115 190,120" fill="white" stroke="black" strokeWidth="2" />
            </g>

            {/* Face */}
            <g id="pizzabot-face">
                <ellipse cx="80" cy="75" rx="10" ry="15" fill="white" stroke="black" strokeWidth="2" />
                <circle cx="82" cy="78" r="5" fill="black" />
                <ellipse cx="120" cy="75" rx="10" ry="15" fill="white" stroke="black" strokeWidth="2" />
                <circle cx="118" cy="78" r="5" fill="black" />
                <path d="M 90,105 C 95,115 105,115 110,105" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" />
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
