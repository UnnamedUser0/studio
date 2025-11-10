export function PizzaBotIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        viewBox="0 0 128 128"
        xmlns="http://www.w3.org/2000/svg"
        >
        <g stroke-linecap="round" stroke-linejoin="round" stroke-width="8">
            {/* Crust */}
            <path d="M116.5 64C116.5 33.3 90.7 7.5 60 7.5S3.5 33.3 3.5 64c0 14 5 26.8 13.5 36.5" fill="#f4b459" stroke="#c78835"/>
            {/* Pizza body */}
            <path d="M124.5 73c0 28.4-23.1 51.5-51.5 51.5S21.5 101.4 21.5 73c0-10 3-19.2 8-26.5" fill="#ff6b6b" stroke="#d63031"/>
            {/* Cheese */}
            <path d="M110.5 73c0 20.7-16.8 37.5-37.5 37.5S35.5 93.7 35.5 73c0-7.5 2.2-14.4 6-20.5" fill="#feca57" stroke="#e79c2a" />
            {/* Pepperoni */}
            <circle cx="85" cy="85" r="9" fill="#c0392b" stroke="#a52a2a" />
            <circle cx="60" cy="100" r="9" fill="#c0392b" stroke="#a52a2a" />
            <circle cx="50" cy="70" r="9" fill="#c0392b" stroke="#a52a2a" />
             {/* Eyes */}
            <circle cx="65" cy="50" r="6" fill="#fff"/>
            <circle cx="65" cy="50" r="3" fill="#000"/>
            <circle cx="90" cy="50" r="6" fill="#fff"/>
            <circle cx="90" cy="50" r="3" fill="#000"/>
            {/* Mouth */}
            <path d="M70 65 Q 80 72 90 65" fill="none" stroke="#a52a2a" stroke-width="4"/>
        </g>
        </svg>
    );
  }
  