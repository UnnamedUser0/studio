export function PizzaBotIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
        >
            <g transform="rotate(15 100 100)">
                {/* Main Pizza Slice */}
                <path d="M 50,20 L 150,20 C 145,50 130,100 100,180 C 70,100 55,50 50,20 Z" fill="#FFD700" stroke="#E6A222" strokeWidth="8"/>
                
                {/* Crust */}
                <path d="M 50,20 C 60,10 80,5 100,5 C 120,5 140,10 150,20" fill="#F4B459" stroke="#C78835" strokeWidth="8" />

                {/* Eyes */}
                <circle cx="80" cy="75" r="12" fill="white" />
                <circle cx="82" cy="77" r="6" fill="black" />
                <circle cx="120" cy="75" r="12" fill="white" />
                <circle cx="122" cy="77" r="6" fill="black" />
                <path d="M 70 60 C 75 55, 85 55, 90 60" fill="none" stroke="black" strokeWidth="4" />
                <path d="M 110 60 C 115 55, 125 55, 130 60" fill="none" stroke="black" strokeWidth="4" />

                {/* Mouth */}
                <path d="M 85,105 C 90,115 110,115 115,105" fill="#C0392B" stroke="black" strokeWidth="3" />
                <path d="M 85,105 C 90,112 110,112 115,105 L 110 108 L 90 108 Z" fill="#F08080" />

                {/* Pepperoni */}
                <circle cx="100" cy="50" r="10" fill="#C0392B" stroke="#A52A2A" strokeWidth="2" />
                <circle cx="75" cy="130" r="10" fill="#C0392B" stroke="#A52A2A" strokeWidth="2" />
                <circle cx="125" cy="130" r="10" fill="#C0392B" stroke="#A52A2A" strokeWidth="2" />
                
                {/* Mushrooms */}
                <path d="M 120 95 a 8 5 0 0 1 16 0 v 5 h -16 Z" fill="#C6B2A2" stroke="#8D6E63" strokeWidth="2" />
                <path d="M 75 95 a 8 5 0 0 0 -16 0 v 5 h 16 Z" fill="#C6B2A2" stroke="#8D6E63" strokeWidth="2" />
            </g>
        </svg>
    );
}
