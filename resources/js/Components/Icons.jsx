import React from "react";

const base = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round",
    strokeLinejoin: "round",
};

function Svg({ size = 18, children, style, ...props }) {
    return (
        <svg width={size} height={size} style={{ flexShrink: 0, ...style }} {...base} {...props}>
            {children}
        </svg>
    );
}

export function IconTrophy(props) {
    return (
        <Svg {...props}>
            <path d="M8 4h8v4a4 4 0 0 1-8 0V4z" />
            <path d="M6 4H4a2 2 0 0 0 2 4" />
            <path d="M18 4h2a2 2 0 0 1-2 4" />
            <path d="M10 14v3M14 14v3M8 20h8" />
        </Svg>
    );
}

export function IconUsers(props) {
    return (
        <Svg {...props}>
            <circle cx="9" cy="8" r="3" />
            <path d="M3 20c0-3 2.5-5 6-5s6 2 6 5" />
            <circle cx="17" cy="9" r="2.5" />
            <path d="M15.5 14.2c2.8.3 4.5 2 4.5 4.8" />
        </Svg>
    );
}

export function IconUser(props) {
    return (
        <Svg {...props}>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
        </Svg>
    );
}

export function IconBell(props) {
    return (
        <Svg {...props}>
            <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
            <path d="M10 19a2 2 0 0 0 4 0" />
        </Svg>
    );
}

export function IconPlusCircle(props) {
    return (
        <Svg {...props}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v8M8 12h8" />
        </Svg>
    );
}

export function IconMegaphone(props) {
    return (
        <Svg {...props}>
            <path d="M3 10v4h3l6 4V6l-6 4H3z" />
            <path d="M15 9a3 3 0 0 1 0 6" />
            <path d="M18 6a7 7 0 0 1 0 12" />
        </Svg>
    );
}

export function IconBarChart(props) {
    return (
        <Svg {...props}>
            <path d="M4 20V10M10 20V4M16 20v-7M4 20h16" />
        </Svg>
    );
}

export function IconUserCheck(props) {
    return (
        <Svg {...props}>
            <circle cx="9" cy="8" r="4" />
            <path d="M2 20c0-4 3-7 7-7" />
            <path d="M15 13l2 2 4-4" />
        </Svg>
    );
}

export function IconChevronLeft(props) {
    return (
        <Svg {...props} strokeWidth={2}>
            <path d="M14 6l-6 6 6 6" />
        </Svg>
    );
}

export function IconCalendar(props) {
    return (
        <Svg {...props}>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18" />
            <path d="M8 3v4M16 3v4" />
        </Svg>
    );
}

export function IconTarget(props) {
    return (
        <Svg {...props}>
            <circle cx="12" cy="12" r="8" />
            <circle cx="12" cy="12" r="3.2" />
        </Svg>
    );
}

export function IconArrowUpRight(props) {
    return (
        <Svg {...props}>
            <path d="M7 17L17 7" />
            <path d="M9 7h8v8" />
        </Svg>
    );
}

export function IconStar(props) {
    return (
        <Svg {...props}>
            <path d="M12 3l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.2-5.4 3.2 1.3-6-4.6-4.1 6.1-.6z" />
        </Svg>
    );
}

export function IconMapPin(props) {
    return (
        <Svg {...props}>
            <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z" />
            <circle cx="12" cy="9.5" r="2.3" />
        </Svg>
    );
}

export function IconCheck(props) {
    return (
        <Svg {...props} strokeWidth={2.2}>
            <path d="M4 12l5 5L20 6" />
        </Svg>
    );
}

export function IconX(props) {
    return (
        <Svg {...props} strokeWidth={2.2}>
            <path d="M6 6l12 12M18 6L6 18" />
        </Svg>
    );
}

export function IconSettings(props) {
    return (
        <Svg {...props}>
            <circle cx="12" cy="12" r="3" />
            <path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4" />
        </Svg>
    );
}

export function IconCamera(props) {
    return (
        <Svg {...props}>
            <path d="M4 8a2 2 0 0 1 2-2h1.5l1-1.5h7l1 1.5H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z" />
            <circle cx="12" cy="13" r="3.5" />
        </Svg>
    );
}

export function IconShield(props) {
    return (
        <Svg {...props}>
            <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z" />
        </Svg>
    );
}

export function IconPencil(props) {
    return (
        <Svg {...props}>
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
        </Svg>
    );
}

export function IconChevronDown(props) {
    return (
        <Svg {...props} strokeWidth={2}>
            <path d="M6 9l6 6 6-6" />
        </Svg>
    );
}

export function IconSearch(props) {
    return (
        <Svg {...props}>
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="M20 20l-4.3-4.3" />
        </Svg>
    );
}

export function IconPhone(props) {
    return (
        <Svg {...props}>
            <path d="M5 4h3.5l1.5 4.5L8 10a11 11 0 0 0 6 6l1.5-2 4.5 1.5V19a2 2 0 0 1-2 2C10.6 21 3 13.4 3 4a2 2 0 0 1 2-2z" />
        </Svg>
    );
}

export function IconCreditCard(props) {
    return (
        <Svg {...props}>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 10h18" />
            <path d="M7 15h4" />
        </Svg>
    );
}

export function IconTrash(props) {
    return (
        <Svg {...props}>
            <path d="M4 7h16" />
            <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
            <path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
            <path d="M10 11v6M14 11v6" />
        </Svg>
    );
}
