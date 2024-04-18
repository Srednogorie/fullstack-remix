import { useEffect } from "react";

export default function Complete() {
    useEffect(() => {
        setTimeout(() => {
            window.close();
        }, 3000); // 3000 milliseconds = 3 seconds
    }, []);
    
    return <p>Authentication complete! This window will close shortly.</p>;
}
