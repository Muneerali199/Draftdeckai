"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

interface ReferralHandlerProps {
    onReferralCode: (code: string | null) => void;
}

export function ReferralHandler({ onReferralCode }: ReferralHandlerProps) {
    const searchParams = useSearchParams();

    useEffect(() => {
        const ref = searchParams.get("ref");
        if (ref) {
            onReferralCode(ref.toUpperCase());
            sessionStorage.setItem("referralCode", ref.toUpperCase());
        } else {
            const storedRef = sessionStorage.getItem("referralCode");
            if (storedRef) {
                onReferralCode(storedRef);
            }
        }
    }, [searchParams, onReferralCode]);

    return null;
}
