export function PizzaBotIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Legs */}
            <g id="pizzabot-legs">
                <path d="M 85,155 L 75,180" fill="none" stroke="black" strokeWidth="6" />
                <path d="M 115,155 L 125,180" fill="none" stroke="black" strokeWidth="6" />
                <ellipse cx="70" cy="180" rx="25" ry="10" fill="brown" stroke="black" strokeWidth="2" />
                <ellipse cx="130" cy="180" rx="25" ry="10" fill="brown" stroke="black" strokeWidth="2" />
            </g>

            {/* Main Pizza Slice */}
            <path d="M 50,30 L 150,30 C 145,60 130,110 100,160 C 70,110 55,60 50,30 Z" fill="#FFD700" stroke="#E6A222" strokeWidth="4" strokeLinejoin="round"/>
            
            {/* Crust */}
            <path d="M 45,32 C 55,18 75,10 100,10 C 125,10 145,18 155,32 L 45,32 Z" fill="#F4B459" stroke="#C78835" strokeWidth="4" strokeLinejoin="round" />

            {/* Arm Left (Waving) */}
            <g id="pizzabot-arm">
                <path d="M 65,95 C 45,105 35,125 50,135" fill="none" stroke="black" strokeWidth="6" />
                <path d="M40,145 C30,155 25,145 28,135 C35,120 50,125 50,135" fill="white" stroke="black" strokeWidth="2"/>
                <path d="M 33,133 L 40,138" stroke="black" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M 36,128 L 43,133" stroke="black" strokeWidth="1.5" strokeLinecap="round" />
            </g>
            
            {/* Arm Right (Static) */}
            <g id="pizzabot-arm-right">
                <path d="M 135,95 C 155,85 170,95 165,115" fill="none" stroke="black" strokeWidth="6" />
                <path d="M155,125 C150,135 165,140 175,130 C185,120 180,105 170,110" fill="white" stroke="black" strokeWidth="2"/>
                <path d="M 164,115 L 170,122" stroke="black" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M 168,111 L 174,118" stroke="black" strokeWidth="1.5" strokeLinecap="round" />
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
