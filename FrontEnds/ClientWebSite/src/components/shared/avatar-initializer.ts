import * as AvatarPrimitive from "@radix-ui/react-avatar";
import {AvatarFallback} from "@/components/ui/avatar";
import React from "react";

export default function getInitials(name?: string) {
    const n = (name ?? "").trim()
    if (!n) return "؟"

    // اگر اسم چندکلمه‌ای بود: حرف اول دو کلمه
    const parts = n.split(/\s+/).filter(Boolean)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
}


const hashString = (str: string) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) | 0
    return Math.abs(hash)
}

export const avatarColors = (name?: string, theme: "light" | "dark" = "light") => {
    const n = (name ?? "").trim() || "default"
    const h = hashString(n) % 360

    // برای خوشگل‌تر شدن، کمی هم اشباع/روشنایی کنترل شده
    const s = 70
    const bgL = theme === "light" ? 90 : 22
    const fgL = theme === "light" ? 25 : 88

    return {
        backgroundColor: `hsl(${h} ${s}% ${bgL}%)`,
        color: `hsl(${h} 35% ${fgL}%)`,
    } as React.CSSProperties
}
