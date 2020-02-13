export function decompose(googleId: string) {
    const parts = googleId.split('|');
    return { id: parts[0], group: parts.slice(1).join("") };
}

export function compose(id: string, group: string) {
    return `${id}|${group}`;
}