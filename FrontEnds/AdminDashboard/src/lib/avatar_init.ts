// تابعی برای تولید رنگ رندم
const generateRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};

// تابع اصلی برای گرفتن آواتار
const getUserAvatar = (userName: string) => {
    const initials = userName.split(' ').map(word => word.charAt(0).toUpperCase()).join('');
    const color = generateRandomColor();

    // ساخت URL آواتار
    return `https://placehold.co/100x100/${color.substring(1)}/000000?text=${initials}`;
};

export default getUserAvatar;